'use strict';

const fs = require('fs');
const net = require('net');
const tracker = require('./tracker');
const message = require('./message');
const Pieces = require('./Pieces');
const Queue = require('./Queue');


module.exports = (torrent, path, noOfFiles, counter) => {
	theDownload(torrent, path, noOfFiles, counter);	
};

function theDownload (torrent, path, noOfFiles, counter) {
	// pass torrent here
	const pieces = new Pieces(torrent, counter);
	// open file to download torrent into
	const file = fs.openSync(path, 'w');
	tracker.getPeers(torrent, peers => {
		peers.forEach(peer => download(peer, torrent, pieces, file, noOfFiles, counter));
	});	
};

function download(peer, torrent, pieces, file, noOfFiles, counter) {
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
	});
	//socket.on('error', console.log);
	socket.connect(peer.port, peer.ip, () => {
		//console.log("Handshaking with peer: ", peer);
		socket.write(message.buildHandshake(torrent));
	});
	const queue = new Queue(torrent);
	onWholeMsg(socket, pieces, msg => msgHandler(msg, socket, pieces, queue, torrent, file, noOfFiles, counter));
}
function onWholeMsg(socket, pieces, callback) {
	let savedBuf = Buffer.alloc(0);	// create buffer of size 0
	let handshake = true;

	//console.log('pieces.isDone: ', pieces.isDone());
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

		while (savedBuf.length >= 4 && savedBuf.length >= msgLen() && !pieces.isDone()) {
			callback(savedBuf.slice(0, msgLen()));
			savedBuf = savedBuf.slice(msgLen());
			handshake = false;
		}	

		/*if(pieces.isDone()) {
			socket.end();
			socket.destroy();
			//console.log('Socket destroyed? ', socket.destroyed);
		} else {
			while (savedBuf.length >= 4 && savedBuf.length >= msgLen() && !pieces.isDone()) {
				callback(savedBuf.slice(0, msgLen()));
				savedBuf = savedBuf.slice(msgLen());
				handshake = false;
			}	
		}*/
	});
}
function msgHandler(msg, socket, pieces, queue, torrent, file, noOfFiles, counter) {
	if(isHandshake(msg)) {
		//console.log("Handshake with peer complete!");
		socket.write(message.buildInterested());	
	} else {
		const m = message.parse(msg);
		//console.log("Message ID: " + m.id);

		if (m.id === 0) chokeHandler(socket);
		if (m.id === 1) unchokeHandler(socket, pieces, queue);
		if (m.id === 4) haveHandler(socket, pieces, queue, m.payload);
		if (m.id === 5) bitfieldHandler(socket, pieces, queue, m.payload);
		if (m.id === 7) pieceHandler(socket, pieces, queue, torrent, file, m.payload, noOfFiles, counter);
	}
}

function isHandshake(msg) {
	return msg.length === msg.readUInt8(0) + 49 &&
			msg.toString('utf8', 1, 20) === 'BitTorrent protocol';
}

function chokeHandler(socket) {
	//console.log("Request choked by peer!");
	socket.end();
}

function unchokeHandler(socket, pieces, queue) {
	queue.choked = false;
	//console.log("Request unchoked by peer, downloading next piece...");
	requestPiece(socket, pieces, queue);
}

function haveHandler(socket, pieces, queue, payload) {
	const pieceIndex = payload.readUInt32BE(0);
	const queueEmpty = queue.length === 0;
	queue.queue(pieceIndex);
	if (queueEmpty) {
		requestPiece(socket, pieces, queue);
	}
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
}

function pieceHandler(socket, pieces, queue, torrent, file, piecesResp, noOfFiles, counter) {
	pieces.printPercentDone();
	pieces.addReceived(piecesResp);

	// write to file...
	const offset = piecesResp.index * torrent.info['piece length'] + piecesResp.begin;
	fs.write(file, piecesResp.block, 0, piecesResp.block.length, offset,() => {});

	if(pieces.isDone()) {
		counter++;
		console.log();		
		console.log('DONE!!!!');
		try { 
			fs.closeSync(file);
			console.log('Data written to file!');
		} catch(e) {}

		if(noOfFiles === counter) {
			console.log('Download Complete! Process exiting...');
			process.exit();
		} else {
			console.log('noOfFiles: ', noOfFiles);
			console.log('counter: ', counter);
			theDownload(torrent, torrent.info.files[counter].path.toString(), noOfFiles, counter);
		}

	} else {
		requestPiece(socket, pieces, queue);
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


