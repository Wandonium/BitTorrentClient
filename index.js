'use strict';
const download = require('./src/download');
const tracker = require('./src/tracker');
const torrentParser = require('./src/torrent-parser');
const urlParse = require('url').parse;

const torrent = torrentParser.open(process.argv[2]);
// Object.keys(torrent).forEach( key => {
// 	console.log(key + ":" + torrent[key]);
// });
// Object.keys(torrent.info.files[0]).forEach( key => {
// 	console.log(key + ":" + torrent.info.files[0][key]);
// });
/*console.log();
const torrentArray = Object.keys(torrent).map( key => torrent[key] );
const announceList = torrentArray[1].toString().split(',');
//console.log("Torrent announce-list: ", announceList);
let thePeers = [];
for(let i = 0; i < announceList.length; i++) {
	const url = urlParse(announceList[i]);
	if(!announceList[i].includes('http') && url.port !== null) {
		tracker.getPeers(torrent, announceList[i], peers => {
			console.log('List of peers: ', thePeers);
			thePeers = thePeers.concat(peers);
		});
	}
}*/
/*if(torrent.info.files === undefined) {
	download(torrent, torrent.info.name.toString());
} else {
	const files = Object.keys(torrent.info.files).map(key => torrent.info.files[key]);
	for(let i = 0; i < files.length; i++) {
		download(torrent, files[i].path.toString());
	}
}*/
//console.log(torrent.info.files[0].path.toString());
// console.log(torrent.info.files);

download(torrent, torrent.info.name.toString());
