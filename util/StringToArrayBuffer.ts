export function StringToArrayBuffer(s: string) {
  let buf = new ArrayBuffer(s.length * 2);
  let view = new DataView(buf);
  for (let i = 0; i < s.length; i++) {
    view.setUint16(i * 2, s.charCodeAt(i), true);
  }

  return buf;
}

export function ArrayBufferToString(arr: ArrayBuffer) {
  let c = new Uint16Array(arr.byteLength / 2);
  let view = new DataView(arr);
  for (let i = 0; i < arr.byteLength; i += 2) {
    c[i / 2] = view.getUint16(i, true);
  }

  return String.fromCharCode(...c);
}