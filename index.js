import 'audioworklet-polyfill'

// FIXME: move worklet into a separate file
const workletURL = URL.createObjectURL(new Blob([(function(){
  registerProcessor('writer-worklet', class extends AudioWorkletProcessor {
    constructor() {
      super()
      this.q = []
      this.end = false
      this.cur = null
      this.port.onmessage = e => e.data === null ? this.end = true : this.q.push(e.data)
    }
    process([input], [output]) {
      let channels = output.length, remains = output[0].length
      while (remains > 0) {
        if (!this.cur) {
          if (this.cur = this.q.shift()) this.port.postMessage(this.cur[0].length)
          else {
            if (this.end) {this.port.postMessage(null);return false}
            this.port.postMessage(0)
            break
          }
        }
        if (this.cur[0].length > remains) {
          for (let c = 0; c < channels; c++) {
            output[c].set(this.cur[c].subarray(0, remains), output[c].length - remains)
            this.cur[c] = this.cur[c].subarray(remains)
          }
          remains = 0
        }
        else {
          for (let c = 0; c < channels; c++) output[c].set(this.cur[c], output[c].length - remains)
          remains -= this.cur[0].length
          this.cur = null
        }
      }
      return true
    }
  })
}).toString().slice(11,-1)], { type: 'text/javascript' }));

// to be sync-api compatible, it creates worklet lazily
export default function createWriter (dest) {
  if (!dest) dest = (new AudioContext).destination
  const context = dest.context

  let listeners

  let init = context.audioWorklet.addModule(workletURL).then(() => {
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
  })

  // to make API sync, first consuming awaits for init
  function write (data) {
    if (write.then) write.then = null
    return init ? init.then(() => push(data)) : push(data)
  }
  write.then = (fn) => {
    write.then = null
    init.then(() => fn(write))
  }

  function push(data) {
    if (write.node.closed) throw Error('Writer is closed')

    let arr = data
    if (data) {
      if (data.getChannelData) {
        arr = []
        for (let c = 0; c < dest.channelCount; c++) {
          arr[c] = c < data.numberOfChannels ? data.getChannelData(c) : new Float32Array()
        }
      }
      else if (typeof data[0] === 'number') {
        arr = []
        let len = Math.floor(data.length / dest.channelCount)
        for (let c = 0; c < dest.channelCount; c++) {
          arr[c] = data.subarray ? data.subarray(c * len, c * len + len) : new Float32Array(data.slice(c * len, c * len + len))
        }
      }
    }

    return new Promise(resolve => {
      listeners.push(resolve)
      write.node.port.postMessage(arr)
    })
  }

  return write
}
