
import 'audioworklet-polyfill'
import createContext from 'audio-context';

// to be sync-api compatible, it creates worklet lazily
export default async function createWriter (dest = createContext().destination) {
  const context = dest.context

  // var blob = new Blob([`
  //   registerProcessor('writer-worklet', class extends AudioWorkletProcessor {
  //     process(is, os) {
  //       const i = is[0], o = os[0];
  //       for (let c = 0; c < i.length; c++) {
  //         const ic = i[c], oc = o[c];
  //         for (let i = 0; i < ic.length; i++) {
  //           oc[i] = ic[i];
  //         }
  //       }
  //     }
  //   })
  // `], { type: 'text/javascript' });

  const workletURL = URL.createObjectURL(new Blob([`
    registerProcessor('writer-worklet', class extends AudioWorkletProcessor {
      constructor() {
        super()
        this.queue = []
        this.port.onmessage = e => {
          this.queue.push(e.data)
        }
      }
      process(inputs, outputs) {
        const input = inputs[0], output = outputs[0];
        for (let channel = 0; channel < output.length; channel++) {
          // output[channel].set(input[channel])
          // return true

          let out = output[channel]
          let remains = out.length
          while (remains > 0) {
            let data = this.queue[0]
            if (!data) remains = 0
            else if (data.length > remains) {
              out.set(data.subarray(0, remains), out.length - remains)
              this.queue[0] = data.subarray(remains)
              remains = 0
            }
            else {
              out.set(data, out.length - remains)
              remains -= data.length
              this.queue.shift()
            }
          }
        }
        return true
      }
    })

  `], { type: 'text/javascript' }));

  // writer.connect(dest || context.destination)

  await context.audioWorklet.addModule(workletURL);
  const writer = new AudioWorkletNode(context, 'writer-worklet');
  writer.port.onmessage = e => {
    let { data } = e
  }
  writer.connect(context.destination);

  return (data) => {
    writer.port.postMessage(data)
  }
}
