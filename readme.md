# web-audio-write [![Greenkeeper badge](https://badges.greenkeeper.io/audiojs/web-audio-write.svg)](https://greenkeeper.io/) [![stable](https://img.shields.io/badge/stability-unstable-green.svg)](http://github.com/badges/stability-badges)

Send data to audio context.

## Usage

[![npm install web-audio-write](https://nodei.co/npm/web-audio-write.png?mini=true)](https://npmjs.org/package/web-audio-write/)

```js
import createWriter from 'web-audio-write'
import createContext from 'audio-context'

const context = createContext()
const write = createWriter(context.destination)
const SIZE = 1024, CHANNELS = 2

;(
	for (let n = 0; n < 10; n++) {
		// generate planar audio buffer w/noise
		let data = new Float32Array(CHANNELS * SIZE)
		for (let i = 0; i < data.length; i++) {
			data[i] = Math.random() * 2. - 1.
		}

		// output to speakers
		await write(data)
	}
)();

// end
write(null)
```

## API

### `let write = createWriter(destNode=defaultContext)`

Create function writing to web-audio _AudioNode_. The created writer has the following signature: `promise = write(data)`.
`data` can be either _AudioBuffer_ or _FloatArray_ / _Array_ with planar channels layout with numbers from `-1...+1` range.
`promise` is resolved when the `data` is consumed.
To end writing, call `write(null)`.

## Related

* [web-audio-read](https://github.com/audiojs/web-audio-read) — read data from web audio.

## License

(c) 2019 audiojs. MIT License

<p align="right">HK</p>
