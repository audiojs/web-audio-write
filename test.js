'use strict'

var t = require('tape');
var context = require('audio-context')();
var Writer = require('./');
var AudioBuffer = require('audio-buffer');
var util = require('audio-buffer-utils');
var Generate = require('audio-generator/direct.js')



t('Writer', function (t) {
	let frame = 1024;
	let write = Writer(context.destination, {
		samplesPerFrame: 1024
	});
	let generate = Generate(t => Math.sin(440 * t * Math.PI * 2));

	let isStopped = 0;
	setTimeout(() => {
		isStopped = 1;
	}, 500);
	function gen (err) {
		if (err) throw err;
		if (isStopped) {
			write(null);
			t.end()
			return;
		}
		let buf = generate(util.create(frame));
		write(buf, gen);
	}
	gen();
});


t('Write AudioBuffer', function (t) {
	var write = Writer(context.destination);

	var buf = new AudioBuffer(context, {length: 1024*8});
	util.noise(buf);
	write(buf);
	write(null);

	setTimeout(function () {
		t.end();
	}, 300);
});

t('Write Float32Array', function (t) {
	var write = Writer(context.destination, {channels: 1});

	var buf = new AudioBuffer(context, {length: 1024*8});
	util.noise(buf);

	write(buf.getChannelData(0));
	write(null)

	setTimeout(function () {
		t.end();
	}, 300);
});

t('Write Array', function (t) {
	var write = Writer(context.destination, {channels: 1});

	var a = Array(1024*8).fill(0).map(function () {return Math.random()});

	write(a);
	write(null)

	setTimeout(function () {
		t.end();
	}, 300);
});

t('Write ArrayBuffer', function (t) {
	var write = Writer(context.destination, {channels: 1});

	var buf = new AudioBuffer(context, {length: 1024*8});
	util.noise(buf);

	write(buf.getChannelData(0).buffer);
	write(null)

	setTimeout(function () {
		t.end();
	}, 300);
});


t('Write Buffer', function (t) {
	var write = Writer({channels: 1});

	var buf = new AudioBuffer(context, {length: 1024*8});
	util.noise(buf);

	buf = new Buffer(buf.getChannelData(0).buffer);

	write(buf);
	write(null)

	setTimeout(function () {
		t.end();
	}, 300);
});


t('Chain of sound processing', function (t) {
	var panner = context.createStereoPanner();
	panner.pan.value = -1;
	panner.connect(context.destination);

	var write = Writer(panner);

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
	let write = Writer(context.destination, {
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

	let write = Writer(context.destination)

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
