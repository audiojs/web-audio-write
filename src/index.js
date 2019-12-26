import 'audioworklet-polyfill'
import createContext from 'audio-context';


// to be sync-api compatible, it creates worklet lazily
export default function createWriter (dest = createContext().destination) {
  const context = dest.context

  // FIXME: move worklet into a separate file
  const workletURL = URL.createObjectURL(new Blob([`
    registerProcessor('writer-worklet', class extends AudioWorkletProcessor {
      constructor() {
        super()
        this.queue = []
        this.end = false
        this.current = null
        this.port.onmessage = e => {
          if (e.data === null) {
            this.end = true
          }
          else {
            this.queue.push(e.data)
          }
        }
      }
      process(inputs, outputs) {
        const input = inputs[0], output = outputs[0];
        const channels = output.length

        // end is abrupt here, it does not wait for all planned data to be consumed
        // FIXME: mb it is better to finish this.current?
        if (this.end) {
          while (this.queue.shift()) this.port.postMessage(null)
          this.port.postMessage(null)
          return false
        }

        let remains = output[0].length
        while (remains > 0) {
          // get new chunk from queue
          if (!this.current) {
            let data = this.queue.shift()
            if (!data) break
            this.current = []
            let len = Math.floor(data.length / channels)
            for (let channel = 0; channel < channels; channel++) {
              this.current[channel] = data.subarray(channel * len, channel * len + len)
            }
            this.port.postMessage(this.current[0].length)
          }
          if (this.current[0].length > remains) {
            for (let channel = 0; channel < channels; channel++) {
              output[channel].set(this.current[channel].subarray(0, remains), output[channel].length - remains)
              this.current[channel] = this.current[channel].subarray(remains)
            }
            remains = 0
          }
          else {
            for (let channel = 0; channel < channels; channel++) {
              output[channel].set(this.current[channel], output[channel].length - remains)
            }
            remains -= this.current[0].length
            this.current = null
          }
        }
        return true
      }
    })
  `], { type: 'text/javascript' }));

  let listeners, init

  init = context.audioWorklet.addModule(workletURL).then(() => {
    init = null
    write.node = new AudioWorkletNode(context, 'writer-worklet', {
      outputChannelCount: [dest.channelCount]
    })
    listeners = []
    write.node.port.onmessage = e => {
      listeners.shift()(e)
      if (e.data === null) write.node.closed = true
    }
    write.node.connect(dest)
    write.node.write = write
    return write
  })

  function push(data) {
    if (write.node.closed) throw Error('Writer is closed')
    return new Promise(resolve => {
      listeners.push(resolve)
      write.node.port.postMessage(data)
    })
  }

  // to make API sync, first consuming awaits for init
  function write (data) {
    if (write.then) write.then = null
    return init ? init.then(() => push(data)) : push(data)
  }
  write.then = (fn) => {
    write.then = null
    init.then(() => fn(write))
  }

  return write
}
