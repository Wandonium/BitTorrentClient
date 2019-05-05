'use strict';
const download = require('./src/download');
const tracker = require('./src/tracker');
const torrentParser = require('./src/torrent-parser');
const urlParse = require('url').parse;

const torrent = torrentParser.open(process.argv[2]);
/*Object.keys(torrent).forEach( key => {
	console.log(key + ":" + torrent[key]);
});
Object.keys(torrent.info).forEach( key => {
	console.log(key + ":" + torrent.info[key]);
});*/


if(torrent.info.files === undefined) {
	download(torrent, torrent.info.name.toString(), 1, 0);
} else {
	const files = Object.keys(torrent.info.files).map(key => torrent.info.files[key]);
	download(torrent, files[0].path.toString(), files.length, 0);
	// for(let i = 0; i < files.length; i++) {
		
	// }
}
//console.log(torrent.info.files[0].path.toString());
// console.log(torrent.info.files);

