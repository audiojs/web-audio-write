import t from 'tst'
import createContext from 'audio-context'
import createWriter from './src/index'
import { time } from 'wait-please'
import AudioBuffer from 'audio-buffer'
import util from 'audio-buffer-utils'
// import osc from 'audio-oscillator'


t('basic', async (t) => {
	const context = createContext(3)
	const write = await createWriter(context.destination)

	const FRAME = 1024, N = 20, CHANNELS = 2

	let consumed = 0
	let generators = [
		createGenerator(context.sampleRate, t => Math.sin(440 * t * Math.PI * 2)),
		createGenerator(context.sampleRate, t => Math.sin(440 * t * Math.PI * 2))
	]

	for (let i = 0; i < N; i++) {
		let data = new Float32Array(FRAME * CHANNELS)
		generators[0](data.subarray(0, FRAME))
		generators[1](data.subarray(FRAME))
		await write(data).then(e => (consumed += e.data))
	}
	await write(null)

	t.equal(consumed, FRAME * N, 'consumed number of samples is purrfæct')

	t.throws(() => {
		write([])
	})

	t.end()
});


t('write AudioBuffer', async (t) => {
	var context = createContext()

	var write = createWriter(context.destination);

	var buf = new AudioBuffer(context, { length: 1024 * 10 });
	util.noise(buf);
	write(buf);
	await write(null);

	t.end()
});

t('chain of sound processing', async (t) => {
	var context = createContext()

	var panner = context.createStereoPanner();
	panner.pan.value = -1;
	panner.connect(context.destination);

	var write = createWriter(panner);
	const N = 20, FRAME = 1024, CHANNELS = context.destination.channelCount

	let generators = [
		createGenerator(context.sampleRate, t => Math.sin(440 * t * Math.PI * 2)),
		createGenerator(context.sampleRate, t => Math.sin(440 * t * Math.PI * 2))
	]

	for (let i = 0; i < N; i++) {
		let data = new Float32Array(FRAME * CHANNELS)
		generators[0](data.subarray(0, FRAME))
		generators[1](data.subarray(FRAME))
		if (i > N/2) panner.pan.value = 1
		await write(data)
	}
	await write(null)

	t.end()
});

function createGenerator (sampleRate, fn) {
	let c = 0
	return (arr) => {
		for (let i = 0; i < arr.length; i++) {
			let t = c / sampleRate
			arr[i] = fn(t)
			c++
		}
		return arr
	}
}
