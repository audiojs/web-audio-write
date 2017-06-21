/**
 * @module  web-audio-write
 *
 * Write data to web-audio.
 */
'use strict';


const extend = require('object-assign')
const util = require('audio-buffer-utils')
const isAudioBuffer = require('is-audio-buffer')
const AudioBufferList = require('audio-buffer-list')
const AudioBuffer = require('audio-buffer')

module.exports = WAAWriter;



/**
 * @constructor
 */
function WAAWriter (target, options) {
	if (!target || !target.context) throw Error('Pass AudioNode instance first argument')

	if (!options) {
		options = {};
	}

	options.context = target.context;

	options = extend({
		/**
		 * There is an opinion that script mode is better.
		 * https://github.com/brion/audio-feeder/issues/13
		 *
		 * But for me there are moments of glitch when it infinitely cycles sound.
		 *
		 * But buffer mode also tends to create noisy clicks. Not sure why, cannot remove that. Suspect that is browser thing.
		 * With script mode I at least defer my responsibility.
		 */
		mode: 'script',
		samplesPerFrame: 1024,

		channels: target.numberOfChannels || 2
	}, options)

	let context = options.context;
	let channels = options.channels;
	let samplesPerFrame = options.samplesPerFrame;
	let sampleRate = context.sampleRate;
	let node, release, isStopped, isEmpty = false;
	let silence = new AudioBuffer(context, {length: samplesPerFrame, numberOfChannels: channels})

	//queued data to send to output
	let data = new AudioBufferList(0, channels)

	//init proper mode
	if (options.mode === 'script') {
		node = initScriptMode()
	}
	else if (options.mode === 'buffer') {
		node = initBufferMode()
	}
	else {
		throw Error('Unknown mode. Choose from \'buffer\' or \'script\'')
	}

	//connect node
	node.connect(target)

	write.end = () => {
		if (isStopped) return;
		node.disconnect()
		isStopped = true;
	}

	return write;

	//return writer function
	function write (buffer, cb) {
		if (isStopped) return;

		if (buffer == null) {
			return write.end()
		}
		else {
			push(buffer)
		}
		release = cb;

		return buffer
	}


	//push new data for the next WAA dinner
	function push (chunk) {
		if (!isAudioBuffer(chunk)) {
			chunk = util.create(chunk, channels)
		}

		data.append(chunk)

		isEmpty = false;
	}

	//get last ready data
	function fetch (size) {
		size = size || samplesPerFrame;

		//if still empty - return existing buffer
		if (isEmpty) return data;

		let output = data.copy(0, size)
		data.consume(size)

		//if size is too small, fill with silence
		if (!output.length) {
			return silence
		}
		else if (output.length < size) {
			output = util.pad(output, size)
		}

		return output;
	}

	/**
	 * Init scriptProcessor-based rendering.
	 * Each audioprocess event triggers tick, which releases pipe
	 */
	function initScriptMode () {
		//buffer source node
		let bufferNode = context.createBufferSource()
		bufferNode.loop = true;
		bufferNode.buffer = new AudioBuffer(context, {length: samplesPerFrame, numberOfChannels: channels})

		node = context.createScriptProcessor(samplesPerFrame)
		node.addEventListener('audioprocess', function (e) {
			//release causes synchronous pulling the pipeline
			//so that we get a new data chunk
			let cb = release;
			release = null;
			cb && cb()

			if (isStopped) return;

			let f = fetch(e.inputBuffer.length)
			util.copy(f, e.outputBuffer)
			// util.copy(fetch(e.inputBuffer.length), e.outputBuffer)
		})

		//start should be done after the connection, or there is a chance it won’t
		bufferNode.connect(node)
		bufferNode.start()

		return node;
	}


	/**
	 * Buffer-based rendering.
	 * The schedule is triggered by setTimeout.
	 */
	function initBufferMode () {
		//how many times output buffer contains input one
		let FOLD = 2;

		//buffer source node
		node = context.createBufferSource()
		node.loop = true;
		node.buffer = new AudioBuffer(context, {length: samplesPerFrame * FOLD, numberOfChannels: channels})

		//output buffer
		let buffer = node.buffer;

		//audio buffer realtime ticked cycle
		//FIXME: find a way to receive target starving callback here instead of unguaranteed timeouts
		setTimeout(tick)

		node.start()

		//last played count, position from which there is no data filled up
		let lastCount = 0;

		//time of start
		//FIXME: find out why and how this magic coefficient affects buffer scheduling
		let initTime = context.currentTime;

		return node;

		//tick function - if the half-buffer is passed - emit the tick event, which will fill the buffer
		function tick (a) {
			if (isStopped) return;

			let playedTime = context.currentTime - initTime;
			let playedCount = playedTime * sampleRate;

			//if offset has changed - notify processor to provide a new piece of data
			if (lastCount - playedCount < samplesPerFrame) {
				//send queued data chunk to buffer
				util.copy(fetch(samplesPerFrame), buffer, lastCount % buffer.length)

				//increase rendered count
				lastCount += samplesPerFrame;

				//if there is a holding pressure control - release it
				if (release) {
					let cb = release;
					release = null;
					cb()
				}

				//call tick extra-time in case if there is a room for buffer
				//it will plan timeout, if none
				tick()
			}
			//else plan tick for the expected time of starving
			else {
				//time of starving is when played time reaches (last count time) - half-duration
				let starvingTime = (lastCount - samplesPerFrame) / sampleRate;
				let remainingTime = starvingTime - playedTime;
				setTimeout(tick, remainingTime * 1000)
			}
		}
	}
}
