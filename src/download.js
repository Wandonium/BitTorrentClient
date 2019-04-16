'use strict';

const fs = require('fs');
const net = require('net');
const tracker = require('./tracker');
const message = require('./message');
const Pieces = require('./Pieces');
const Queue = require('./Queue');

let filePath = null;
module.exports = (torrent, path) => {
	filePath = path;
	//console.log("Downloading: ", filePath);
	tracker.getPeers(torrent, peers => {
		// pass torrent here
		const pieces = new Pieces(torrent);
		let file = null;
		// open file to download torrent into
		fs.open(path, 'w', (e, fd) => {
			peers.forEach(peer => download(peer, torrent, pieces, fd));
			if(e) {console.log(e);}
		});
		// peers.forEach(peer => download(peer, torrent, pieces, file));
	});
};

function download(peer, torrent, pieces, file) {
	const socket = new net.Socket();
	socket.on('error', e => {
		if(e.code === 'ETIMEDOUT') {
			console.log(`Connection to peer ${peer.ip} timed out!`);
			socket.setTimeout(4000, () => {
				socket.connect(peer.port, peer.ip, () => {
					//console.log("Handshaking with peer: ", peer);
					socket.write(message.buildHandshake(torrent));
				});
			});
			console.log('Retrying after 5 seconds...');
		} else {console.log}
		//console.log(e);
	});
	socket.connect(peer.port, peer.ip, () => {
		//console.log("Handshaking with peer: ", peer);
		socket.write(message.buildHandshake(torrent));
	});
	const queue = new Queue(torrent);
	console.log('oWM',onWholeMsg(socket, msg => msgHandler(msg, socket, pieces, queue, torrent, file)));
}
function onWholeMsg(socket, callback) {
	let savedBuf = Buffer.alloc(0);	// create buffer of size 0
	let handshake = true;
	let done = false;

	socket.on('data', recvBuf => {
		// msgLen calculates the length of a whole message
		/** 
		 * If we have already done the handshake then the length
		 * of the message will be 49. Otherwise it will be the 
		 * length of the handshake which is 4.
		*/
		const msgLen = () => handshake ? savedBuf.readUInt8(0) + 49
		: savedBuf.readInt32BE(0) + 4;
		// makes savedBuf equal to recvBuf which is what we receive from peer
		savedBuf = Buffer.concat([savedBuf, recvBuf]);

		while (savedBuf.length >= 4 && savedBuf.length >= msgLen()) {
			done = callback(savedBuf.slice(0, msgLen()));
			//console.log('Done? ', done);
			savedBuf = savedBuf.slice(msgLen());
			handshake = false;
			if(!done){
				break;
			}
		}
	});
	return done;
}
function msgHandler(msg, socket, pieces, queue, torrent, file) {
	if(isHandshake(msg)) {
		//console.log("Handshake with peer complete!");
		socket.write(message.buildInterested());	
	} else {
		const m = message.parse(msg);
		//console.log("Message ID: " + m.id);

		if (m.id === 0) return chokeHandler(socket);
		if (m.id === 1) return unchokeHandler(socket, pieces, queue);
		if (m.id === 4) return haveHandler(socket, pieces, queue, m.payload);
		if (m.id === 5) return bitfieldHandler(socket, pieces, queue, m.payload);
		if (m.id === 7) return pieceHandler(socket, pieces, queue, torrent, file, m.payload);
	}
}

function isHandshake(msg) {
	return msg.length === msg.readUInt8(0) + 49 &&
			msg.toString('utf8', 1, 20) === 'BitTorrent protocol';
}

function chokeHandler(socket) {
	//console.log("Request choked by peer!");
	socket.end();
	return false;
}

function unchokeHandler(socket, pieces, queue) {
	queue.choked = false;
	//console.log("Request unchoked by peer, downloading next piece...");
	requestPiece(socket, pieces, queue);
	return false;
}

function haveHandler(socket, pieces, queue, payload) {
	const pieceIndex = payload.readUInt32BE(0);
	const queueEmpty = queue.length === 0;
	queue.queue(pieceIndex);
	if (queueEmpty) {
		requestPiece(socket, pieces, queue);
	}
	return false;
}

function bitfieldHandler(socket, pieces, queue, payload) {
	const queueEmpty = queue.length === 0;
	payload.forEach((byte, i) => {
		for(let j = 0; j < 8; j++) {
			if(byte % 2) queue.queue(i * 8 + 7 - j);
			byte = Math.floor(byte / 2);
		}
	});
	if(queueEmpty) requestPiece(socket, pieces, queue);
	return false;
}

function pieceHandler(socket, pieces, queue, torrent, file, piecesResp) {
	//console.log("Received piece/block from peer...");
	let done = false;
	pieces.printPercentDone();
	pieces.addReceived(piecesResp);

	// write to file...
	const offset = piecesResp.index * torrent.info['piece length'] + piecesResp.begin;
	fs.write(file, piecesResp.block, 0, piecesResp.block.length, offset,() => {
		//console.log("Piece written to file: ", filePath);
	});

	if(pieces.isDone()) {
		done = true;
		console.log();		
		console.log('DONE!!!!');
		//console.log('Writing data to file...');
		socket.end();
		try { 
			fs.close(file, () => {
				//console.log('Data written to file: ', filePath);
			});
		} catch(e) {}
		return done;
	} else {
		requestPiece(socket, pieces, queue);
		return done;
	}
}
function requestPiece(socket, pieces, queue) {
	if(queue.choked) return null;

	while (queue.length()) {
		const pieceBlock = queue.deque();
		if (pieces.needed(pieceBlock)) {
			socket.write(message.buildRequest(pieceBlock));
			pieces.addRequested(pieceBlock);
			break;
		}
	}
}


