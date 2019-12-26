import 'audioworklet-polyfill'
import createContext from 'audio-context';


// to be sync-api compatible, it creates worklet lazily
export default async function createWriter (dest = createContext().destination) {
  const context = dest.context

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
        // end is abrupt here, it does not wait for all planned data to be consumed
        // FIXME: mb it is better to finish this.current?
        if (this.end) {
          while (this.queue.shift()) this.port.postMessage(null)
          this.port.postMessage(null)
          return false
        }

        const input = inputs[0], output = outputs[0];
        for (let channel = 0; channel < output.length; channel++) {
          let out = output[channel]
          let remains = out.length

          while (remains > 0) {
            if (!this.current) {
              if (this.current = this.queue.shift()) {
                this.port.postMessage(this.current.length)
              }
              else remains = 0
            }

            if (this.current.length > remains) {
              out.set(this.current.subarray(0, remains), out.length - remains)
              this.current = this.current.subarray(remains)
              remains = 0
            }
            else {
              out.set(this.current, out.length - remains)
              remains -= this.current.length
              this.current = null
            }
          }
        }
        return true
      }
    })
  `], { type: 'text/javascript' }));

  await context.audioWorklet.addModule(workletURL);
  const writer = new AudioWorkletNode(context, 'writer-worklet');
  const listeners = []
  writer.port.onmessage = e => {
    listeners.shift()(e)
    if (e.data === null) writer.closed = true
  }
  writer.connect(dest)

  return (data) => {
    if (writer.closed) throw Error('Writer is closed')
    return new Promise(resolve => {
      listeners.push(resolve)
      writer.port.postMessage(data)
    })
  }
}