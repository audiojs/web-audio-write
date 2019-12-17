// class WriteProcessor extends AudioWorkletProcessor {
//   process(is, os) {
//     const i = is[0], o = os[0];
//     for (let c = 0; c < i.length; c++) {
//       const ic = i[c], oc = o[c];
//       for (let i = 0; i < ic.length; i++) {
//         oc[i] = ic[i];
//       }
//     }
//   }
// }

// registerProcessor('writer-worklet', WriteProcessor)

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
