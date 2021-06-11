import { ShaderFileLoader } from "./ShaderFileLoader";
import * as fs from "fs";

export class ShaderFileLoaderNode implements ShaderFileLoader {
  constructor() {}

  open(path: string) : Promise<string> {
    return new Promise((res, rej) => {
      fs.readFile(path, (err, data) => {
        if (err) {
          rej(err);
        } else {
          res(data.toString("utf-8"));
        }
      });
    });
  }
}