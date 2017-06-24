# web-audio-write [![Greenkeeper badge](https://badges.greenkeeper.io/audiojs/web-audio-write.svg)](https://greenkeeper.io/) [![stable](https://img.shields.io/badge/stability-unstable-green.svg)](http://github.com/badges/stability-badges)

Send AudioBuffer/Buffer/ArrayBuffer/FloatArray data to web audio.

## Usage

[![npm install web-audio-write](https://nodei.co/npm/web-audio-write.png?mini=true)](https://npmjs.org/package/web-audio-write/)

```js
const createWriter = require('web-audio-write')
const createGenerator = require('audio-generator')

let write = createWriter(context.destination)
let generate = createGenerator(t => Math.sin(440 * t * Math.PI * 2))
let stop = false

function tick (err) {
	if (err) throw err
	if (stop) {
		write(null)
		return
	}

	//send audio buffer to audio node
	write(generate(), tick)
}
tick()

setTimeout(() => {
	stop = true
}, 500)
```

## API

### `let write = createWriter(destNode, options?)`

Create function writing to web audio AudioNode. The created writer has following signature: `audioBuffer = write(audioBuffer, (err, data)=>{}?)`. To indicate the end, call `write(null)`.

`options` parameter may provide:

* `mode` − `'script'` or `'buffer'`, defines buffer or script mode of feeding data, may affect performance insignificantly.
* `context` − audio context, by default `destNode` context is used.
* `samplesPerFrame` defines processing block size.
* `channels` defines expected buffer number of channels.

Writer recognizes any type of data sent into it: [AudioBuffer](https://github.com/audiojs/audio-buffer), [AudioBufferList](https://github.com/audiojs/audio-buffer-list), ArrayBuffer, FloatArray, Buffer, Array. `samplerPerFrame` and `channels` are used to convert raw data into audioBuffer.

Internally writer uses [audio-buffer-list](https://github.com/audiojs/audio-buffer-list) to manage memory efficiently, providing lowest possible latency.

### `write.end()`

Halt writing, skip all the collected data, disconnect node. To schedule ending use `write(null)`.

## Related

* [web-audio-read](https://github.com/audiojs/web-audio-read) — read data from web audio.
* [web-audio-stream](https://github.com/audiojs/web-audio-stream) — stream interface for web-audio.
* [pull-web-audio](https://github.com/audiojs/pull-web-audio) — pull-stream interface for web-audio.
