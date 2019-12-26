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

### `write = createWriter(audioNode: AudioNode = defaultContext.destination)`

Create a function writing to `audioNode`. Created writer can consume _FloatArray_, _Array_ or _ArrayBuffer_ with planar channels layout with numbers from `-1...+1` range. Each `write` call returns a promise that is resolved when data chunk is being consumed, allowing scheduling subsequent calls. To end writing, call `write(null)`.

## Related

* [web-audio-read](https://github.com/audiojs/web-audio-read) — read data from web audio.

## License

(c) 2019 audiojs. MIT License

<p align="right">HK</p>
