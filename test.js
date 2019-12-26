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


t('Write AudioBuffer', async (t) => {
	var context = createContext()

	var write = createWriter(context.destination);

	var buf = new AudioBuffer(context, { length: 1024 * 10 });
	util.noise(buf);
	write(buf);
	await write(null);

	t.end()
});

t.skip('Writing short blocks', function (t) {
	var write = createWriter({ channels: 1 })

	let data = osc.sine(1024)
	let stop = false
	function tick() {
		if (stop) return
		write(osc.sine(data), tick)
	}
	tick()

	setTimeout(function () {
		stop = true
		write(null)
	}, 500)

	t.end()
})

t.skip('Chain of sound processing', function (t) {
	var panner = context.createStereoPanner();
	panner.pan.value = -1;
	panner.connect(context.destination);

	var write = createWriter(panner);

	var generate = Generate(function (time) {
		return Math.sin(Math.PI * 2 * 440 * time);
	})


	write(generate(util.create(1024*4, 2)))
	write(null);

	setTimeout(function () {
		t.end();
	}, 500);
});

t.skip('Delayed connection/start');


t.skip('Should not finish before limit', t => {
	let write = createWriter(context.destination, {
		mode: 'buffer'
	})

	let buf = util.create(22050)
	util.noise(buf)

	let trigger = false

	write(buf, (err, data) => {
		if (err) t.fail(err)
		t.equal(trigger, true)
		t.end()
	})

	setTimeout(() => {
		trigger = true
		write(null)
	}, 250)
})


t.skip('End should be called after all data is fed', t => {
	t.plan(3)

	let write = createWriter(context.destination)

	let buf = util.create(4410)
	util.noise(buf)

	let trigger = false

	write(buf, (err, data) => {
		if (err) t.fail(err)
		t.equal(trigger, true)
	})
	write(null, (err) => {
		if (err) t.fail(err)
		t.equal(trigger, true)
	})

	t.equal(trigger, false)

	setTimeout(() => {
		trigger = true
	}, 50)
})

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
