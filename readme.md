# web-audio-write [![Build Status](https://travis-ci.org/audiojs/web-audio-write.svg?branch=master)](https://travis-ci.org/audiojs/web-audio-write) [![Greenkeeper badge](https://badges.greenkeeper.io/audiojs/web-audio-write.svg)](https://greenkeeper.io/) [![stable](https://img.shields.io/badge/stability-unstable-green.svg)](http://github.com/badges/stability-badges)

Send AudioBuffer/Buffer/ArrayBuffer/FloatArray data to web audio.

## Usage

[![npm install web-audio-write](https://nodei.co/npm/web-audio-write.png?mini=true)](https://npmjs.org/package/web-audio-write/)

```js
const Writer = require('web-audio-write')
const Generate = require('audio-generator')
const util = require('audio-buffer-utils')

let write = Writer(context.destination)
let generate = Generate(t => Math.sin(440 * t * Math.PI * 2))
let stop = false

function gen (err) {
	if (err) throw err
	if (stop) {
		write(null)
		return
	}

	//generate new audio buffer
	let aBuf = generate(util.create(frame))

	//send audio buffer to audio node
	write(aBuf, gen)
}
gen()

setTimeout(() => {
	stop = true
}, 500)
```

## API

### `let write = createWriter(destNode, options?)`

Create function writing to web audio AudioNode. The created writer has following signature: `write(audioBuffer, err=>{}?)`. To end stream properly, call `write(null)`.

`options` parameter may provide:

* `mode` − 'script' or 'buffer', defines buffer or script mode of feeding data, may affect performance insignificantly.
* `context` − audio context, taken from `destNode`.
* `samplesPerFrame` defines processing block size.
* `channels` defines expected buffer number of channels.

Writer recognizes any type of data sent into it: [AudioBuffer](https://github.com/audiojs/audio-buffer), [AudioBufferList](https://github.com/audiojs/audio-buffer-list), ArrayBuffer, FloatArray, Buffer, Array. `samplerPerFrame` and `channels` are used to convert raw data into audioBuffer.

Internally writer uses [audio-buffer-list](https://github.com/audiojs/audio-buffer-list) to manage memory efficiently, providing lowest possible latency.


## Related

* [web-audio-read](https://github.com/audiojs/web-audio-read) — read data from web audio.
* [web-audio-stream](https://github.com/audiojs/web-audio-stream) — stream interface for web-audio.
* [pull-web-audio](https://github.com/audiojs/pull-web-audio) — pull-stream interface for web-audio.
