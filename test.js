'use strict'

import t from 'tape'
import createContext from 'audio-context'
import createWriter from './src/index'
// import AudioBuffer from 'audio-buffer'
// import osc from 'audio-oscillator'


t.only('basics', async (t) => {
	const context = createContext({ channels: 1 })
	const write = await createWriter(context.destination)

	const FRAME = 1024;


	for (let i = 0; i < 10; i++) {
		let data = generate(new Float32Array(FRAME), t => Math.sin(440 * t * Math.PI * 2));
		await write(data);
	}
	write(null);

	t.end()
});


t('Write AudioBuffer', function (t) {
	var write = createWriter(context.destination);

	var buf = new AudioBuffer(context, {length: 1024*8});
	util.noise(buf);
	write(buf);
	write(null);

	setTimeout(function () {
		t.end();
	}, 300);
});

t('Write Float32Array', function (t) {
	var write = createWriter(context.destination, {channels: 1});

	var buf = new AudioBuffer(context, {length: 1024*8});
	util.noise(buf);

	write(buf.getChannelData(0));
	write(null)

	setTimeout(function () {
		t.end();
	}, 300);
});

t('Write Array', function (t) {
	var write = createWriter(context.destination, {channels: 1});

	var a = Array(1024*8).fill(0).map(function () {return Math.random()});

	write(a);
	write(null)

	setTimeout(function () {
		t.end();
	}, 300);
});

//FIXME
t.skip('Write ArrayBuffer', function (t) {
	var write = createWriter(context.destination, {channels: 1});

	var buf = new AudioBuffer(context, {length: 1024*8});
	util.noise(buf);

	write(buf.getChannelData(0).buffer);
	write(null)

	setTimeout(function () {
		t.end();
	}, 300);
});


t.skip('Write Buffer', function (t) {
	var write = createWriter({channels: 1});

	var buf = new AudioBuffer(context, {length: 1024*8});
	util.noise(buf);

	buf = new Buffer(buf.getChannelData(0).buffer);

	write(buf);
	write(null)

	setTimeout(function () {
		t.end();
	}, 300);
});

t.skip('Writing lengthen blocks than samplesPerFrame', function (t) {

})

t('Writing blocks shorter than samplesPerFrame', function (t) {
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

t('Chain of sound processing', function (t) {
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

t('Delayed connection/start');


t('Should not finish before limit', t => {
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


t('End should be called after all data is fed', t => {
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

let c = 0
function generate (arr, fn) {
	for (let i = 0; i < arr.length; i++) {
		let t = c / 44100
		arr[i] = fn(t)
		c++
	}
	return arr
}
