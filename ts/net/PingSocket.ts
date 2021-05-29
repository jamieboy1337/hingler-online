import { PingQueue } from "../../util/PingQueue";
import { SafeEventEmitter } from "../../util/SafeEventEmitter";
import { ReadyState, SocketLike } from "./SocketLike";

enum PacketType {
  PAYLOAD = 0,
  PING = 1
}

export class PingSocket extends SafeEventEmitter implements SocketLike {
  private socket: SocketLike;
  private queue: PingQueue;
  private pings: Map<number, number>;
  private idLast: number;

  /**
   * Creates a new PingSocket.
   * @param socket - the socket we are creating this ping socket from.
   */
  constructor(socket: SocketLike) {
    super();
    this.socket = socket;
    this.socket.addEventListener("open", this.open_.bind(this));
    this.socket.addEventListener("close", this.close_.bind(this));
    this.socket.addEventListener("message", this.handleMessage_.bind(this));
    this.socket.addEventListener("error", this.error_.bind(this));
    this.queue = new PingQueue(32);
    this.pings = new Map();
    this.idLast = 0;
  }

  addEventListener(type: string, callback: (...args: any) => void) {
    return this.on(type, callback);
  }

  removeEventListener(type: string, callback: (...args: any) => void) {
    return this.remove(type, callback);
  }

  get readyState() {
    return this.socket.readyState;
  }

  close() {
    this.socket.close();
  }

  private open_(e: Event) {
    this.emit("open", e);
  }

  private close_(e: Event) {
    this.emit("close", e);
  }

  private error_(e: Event) {
    this.emit("error", e);
  }

  /**
   * @returns Current ping, in MS.
   */
  getPing() {
    return this.queue.getAverage();
  }

  /**
   * Sends a message on this ping socket.
   * Fails if the socket is closing or closed.
   * @param message - the message we wish to send.
   */
  send(message: ArrayBuffer) {
    let state = this.socket.readyState;
    if (state === ReadyState.CLOSING || state === ReadyState.CLOSED) {
      console.error("Cannot send: socket is closing or closed.");
      return;
    }

    let arr = new Uint8Array(message);

    let bufCopy = new ArrayBuffer(message.byteLength + 8);
    let res = Buffer.from(bufCopy);
    res.set(arr, 8);
    
    let view = new DataView(bufCopy);
    view.setUint32(0, PacketType.PAYLOAD, true);
    view.setUint32(4, this.idLast, true);
    this.pings.set(this.idLast++, performance.now());
    this.socket.send(bufCopy);
  }

  private handleMessage_(e: { data: ArrayBuffer }) {
    let data : ArrayBuffer = e.data;
    let view = new DataView(data);
    let type = view.getUint32(0, true) as PacketType;
    if (type === PacketType.PAYLOAD) {
      let serverId = view.getUint32(4, true);
      this.pong_(serverId);
      let payload = PingSocket.stripMetaData_(data);
      this.emit("message", { data: payload });
    } else { // type === PacketType.PING
      let id = view.getUint32(4, true);
      if (this.pings.has(id)) {
        this.queue.enqueue(performance.now() - this.pings.get(id));
        this.emit("ping");
      }
    }
  }

  private pong_(serverId: number) {
    // get server id (4 - 8)
    // respond with pong
    let pong = new ArrayBuffer(8);
    let viewPong = new DataView(pong);
    viewPong.setUint32(0, PacketType.PING, true);
    // generate message event and pass sliced buffer
    viewPong.setUint32(4, serverId, true);
    this.socket.send(pong);
  }

  private static stripMetaData_(data: ArrayBuffer) {
    let res = data.slice(8);
    return res;
  }
}