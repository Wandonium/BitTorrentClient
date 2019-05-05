'use strict';

const tp = require('./torrent-parser');

module.exports = class {
	constructor(torrent) {
		this._torrent = torrent;
		this._queue = [];
		this.choked = true;
	}

	queue(pieceIndex) {
		const nBlocks = tp.blocksPerPiece(this._torrent, pieceIndex);
		for(let i = 0; i < nBlocks; i++) {
			const pieceBlock = {
				index: pieceIndex,
				begin: i * tp.BLOCK_LEN,
				length: tp.blockLen(this._torrent, pieceIndex, i)
			};
			this._queue.push(pieceBlock);
		}
		//this.sortQueue();
	}

	sortQueue() {
		//console.log('Inside sort queue...');
		for(let k = 0; k < this.length(); k++) {
			for(let i = k; i < this.length(); i++) {
				//console.log(this._queue[i].index > this._queue[k].index);
				if(this._queue[i].index < this._queue[k].index) {
					let temp = this._queue[i];
					this._queue[i] = this._queue[k];
					this._queue[k] = temp;
				}
			}
		}
		//console.log('peek: ', this.peek());
	}

	deque () { return this._queue.shift();}

	peek() { return this._queue;}

	length() { return this._queue.length; }
}