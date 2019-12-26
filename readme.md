# web-audio-write [![Greenkeeper badge](https://badges.greenkeeper.io/audiojs/web-audio-write.svg)](https://greenkeeper.io/) [![stable](https://img.shields.io/badge/stability-unstable-green.svg)](http://github.com/badges/stability-badges)

Send samples data to ∀ web-audio node.

## Usage

[![npm install web-audio-write](https://nodei.co/npm/web-audio-write.png?mini=true)](https://npmjs.org/package/web-audio-write/)

```js
import createWriter from 'web-audio-write'

const context = new AudioContext()
const write = await createWriter(context) // await is optional

for (let n = 0; n < 10; n++) await write(noise())
write(null)

function noise (frame=1024, channels=2) {
	let data = new Float32Array(channels * frame)
	for (let i = 0; i < data.length; i++) {
		data[i] = Math.random() * 2. - 1.
	}
	return data
}
```

## API

#### `write = createWriter(audioNode: AudioNode = defaultContext.destination)`

Create a function, writing any data to any `AudioNode`. Channel number and sample rate is derived from `audioNode`.

#### `promise = write(samples)`

Send data to destination node.
`samples` can be _AudioBuffer_, _Array_ of _Arrays_, _FloatArray_, _Array_ or _ArrayBuffer_ with planar channels layout, with numbers ranging from `-1...+1`.
`promise` is resolved when data chunk is going to be fully consumed, that's a good place to feed more data.
`write(null)` ends writing, skipping the reset of data in the buffer.
`write.node` exposes worklet web-audio node.

## Related

* [web-audio-read](https://github.com/audiojs/web-audio-read) — read data from web audio.

## License

(c) 2019 audiojs. MIT License

<p align="right">HK</p>
