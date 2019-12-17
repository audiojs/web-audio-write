
import 'audioworklet-polyfill'

// to be sync-api compatible, it creates worklet lazily
export default async function createWriter (dest) {
  const context = new AudioContext()

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

class BypassProcessor extends AudioWorkletProcessor {

  // When constructor() undefined, the default constructor will be
  // implicitly used.

  process(inputs, outputs) {
    // By default, the node has single input and output.
    const input = inputs[0];
    const output = outputs[0];

    for (let channel = 0; channel < output.length; ++channel) {
      output[channel].set(input[channel]);
    }

    return true;
  }
}

registerProcessor('bypass-processor', BypassProcessor);
  `], { type: 'text/javascript' }));

  // context.audioWorklet.addModule(workletURL)
  // const writer = new AudioWorkletNode(context, 'writer-worklet')
  // writer.connect(dest || context.destination)

    await context.audioWorklet.addModule(workletURL);
    const oscillator = new OscillatorNode(context);
    const bypasser = new AudioWorkletNode(context, 'bypass-processor');
    oscillator.connect(bypasser).connect(context.destination);
    oscillator.start();

  return (data) => {

  }
}
