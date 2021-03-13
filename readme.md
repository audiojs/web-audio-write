# web-audio-write [![unstable](https://img.shields.io/badge/stability-unstable-green.svg)](http://github.com/badges/stability-badges)

Write data to any web-audio node.

## Usage

[![npm install web-audio-write](https://nodei.co/npm/web-audio-write.png?mini=true)](https://npmjs.org/package/web-audio-write/)

```js
import createWriter from 'web-audio-write'

const context = new AudioContext()
const write = createWriter(context.destination)

for (let n = 0; n < 10; n++) await write(noise())
write.end()

function noise (frame=1024, channels=2) {
	let data = new Float32Array(channels * frame)
	for (let i = 0; i < data.length; i++) {
		data[i] = Math.random() * 2. - 1.
	}
	return data
}
```

## API

#### `write = createWriter(node = audioContext.destination)`

Create a function, writing any data to any _AudioNode_. Channel number and sample rate is derived from destination `node`.

#### `async write(samples)`

Send data to the destination `node`.
`samples` can be an array with planar channels layout or a list of arrays, with floats in `-1...+1` range.
Returns `promise` that is resolved when data chunk is being consumed, that's a good place to feed more data.

#### `write(null)`

Schedules end of writing.

#### `write.node`

Exposes worklet web-audio node.

## Related

* [web-audio-read](https://github.com/audiojs/web-audio-read) — read data from web audio.

## License

(c) 2019 audiojs. MIT License

<p align="center">ॐ</p>
