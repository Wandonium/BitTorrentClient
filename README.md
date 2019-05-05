# BitTorrent Client

A bitTorrent client (like uTorrent or Transmission) built with nodejs. The client lets you download a file given the .torrent file from any torrent aggregator like [piratebay](https://www.google.com/search?q=piratebay&oq=piratebay&aqs=chrome..69i57j0l5.1981j1j4&sourceid=chrome&ie=UTF-8) or [1337X](https://1337x.to/home/).

## Getting Started

Clone or download the project freely. To run the project use the following command:
```
node index.js a_file.torrent
```
where a_file.torrent is the .torrent file for the file you want to download.
The client is under development and can't handle multi-file directories yet or seed to peers. It can only download (leech) single file torrents from peers.

### Prerequisites

You will obviously need node to run the project which can be installed using:

```
sudo apt install node
```
which comes bundled with npm.

### Installing

Once you have node running you will need the following modules
* Bignum
* Bencode
* Crypto
* Dgram

These can be installed with npm in the following way:

```
npm install module
```

where 'module' is the module you want to install. For instance, to install bignum you would use the command:

```
npm install bignum
```

I have added a few .torrent files I used for testing. They mostly download ebooks and songs.

## Built With

* [NodeJS](https://nodejs.org/en/)
* [NPM](https://www.npmjs.com/) 

## Authors

* **Wando Hillary** 

## License

The MIT License (MIT)
=====================

Copyright © `<2019>` Wando Hillary `<me@hillarywando.com>`

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the “Software”), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.


## Acknowledgments

* [Allen Kim](https://allenkim67.github.io/programming/2016/05/04/how-to-make-your-own-bittorrent-client.html#conclusion)

