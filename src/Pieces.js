'use strict';

const tp = require('./torrent-parser');

module.exports = class {
	constructor(torrent) {
		function buildPiecesArray() {
			const nPieces = torrent.info.pieces.length / 20;
			const arr = new Array(nPieces).fill(null);
			return arr.map((_, i) => new Array(tp.blocksPerPiece(torrent, i)).fill(false));
		}
		this._requested = buildPiecesArray();
		this._received = buildPiecesArray();
	}

	addRequested(pieceBlock) {
		const blockIndex = pieceBlock.begin / tp.BLOCK_LEN;
		this._requested[pieceBlock.index][blockIndex] = true;
	}

	addReceived(pieceBlock) {
		const blockIndex = pieceBlock.begin / tp.BLOCK_LEN;
		this._received[pieceBlock.index][blockIndex] = true;
	}

	needed(pieceBlock) {
		if(this._requested.every(blocks => blocks.every(i => i))) {
			// use slice method to copy one array into another
			this._requested = this._received.map(blocks => blocks.slice());
		}
		const blockIndex = pieceBlock.begin / tp.BLOCK_LEN;
		return !this._requested[pieceBlock.index][blockIndex];
	}

	isDone() {
		return this._received.every(blocks => blocks.every(i => i));
	}

	printPercentDone() {
	    const downloaded = this._received.reduce((totalBlocks, blocks) => {
	      return blocks.filter(i => i).length + totalBlocks;
	    }, 0);

	    const total = this._received.reduce((totalBlocks, blocks) => {
	      return blocks.length + totalBlocks;
	    }, 0);

	    const percent = Math.floor(downloaded / total * 100);

	    process.stdout.write('progress: ' + percent + '%\r');
	}
};