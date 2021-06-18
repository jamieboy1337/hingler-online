export function StringToArrayBuffer(s: string) {
  let buf = new ArrayBuffer(s.length * 2);
  let view = new DataView(buf);
  for (let i = 0; i < s.length; i++) {
    view.setUint16(i * 2, s.charCodeAt(i), true);
  }

  return buf;
}

export function ArrayBufferToString(arr: ArrayBuffer) {
  let dec = new TextDecoder("utf-8");
  return dec.decode(arr);
}