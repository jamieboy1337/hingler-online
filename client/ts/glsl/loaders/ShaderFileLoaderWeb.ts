import { ShaderFileLoader } from "./ShaderFileLoader";

export class ShaderFileLoaderWeb implements ShaderFileLoader {
  constructor() {}

  async open(path: string) : Promise<string> {
    return new Promise(async (res, rej) => {
      fetch(path)
      .then((resp) => {
        if (resp.status < 200 || resp.status >= 400) {
          rej(resp.text());
        } else {
          res(resp.text());
        }
      })
    })
  }
}