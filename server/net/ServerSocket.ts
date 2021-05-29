import { ReadyState, SocketLike } from "../../ts/net/SocketLike";
import * as ws from "ws";

export class ServerSocket implements SocketLike {
  socket: ws;

  constructor(socket: ws) {
    this.socket = socket;
  }

  get readyState() : ReadyState {
    switch (this.socket.readyState) {
      case this.socket.CLOSED:
        return ReadyState.CLOSED;
      case this.socket.CLOSING:
        return ReadyState.CLOSING;
      case this.socket.CONNECTING:
        return ReadyState.CONNECTING;
      case this.socket.OPEN:
        return ReadyState.OPEN;
    }
  }

  addEventListener(type: string, callback: (event: any) => void) {
    this.socket.on(type, callback);
  }

  removeEventListener(type: string, callback: (event: any) => void) {
    this.socket.on(type, callback);
  }

  send(data: string | ArrayBuffer) {
    this.socket.send(data);
  }

  close(code?: number, reason?: string) {
    this.socket.close(code, reason);
  }
}