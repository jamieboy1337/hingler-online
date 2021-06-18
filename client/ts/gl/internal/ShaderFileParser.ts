import { ShaderFileLoader } from "./loaders/ShaderFileLoader";
import { FileLoader } from "../../game/engine/loaders/FileLoader";

const eol = /\r?\n/;

export class ShaderFileParser {
  private loader: FileLoader;
  private pathRecord: Set<string>;

  constructor(loader: FileLoader) {
    this.loader = loader;
  }

  async parseShaderFile(path: string) {
    this.pathRecord = new Set();
    return await this.parseShaderFile_(path);
  }

  private async parseShaderFile_(path: string) {
    console.log(path);
    if (this.pathRecord.has(path)) {
      console.error("Circular reference detected on " + path + " -- terminating...");
      return "";
    }

    this.pathRecord.add(path);
    const includeHeader = "#include "
    const includeExtract = /\s*#include\s+<?(.*)>.*/g
    let contents = await this.loader.open(path);
    let folder = path.substring(0, Math.max(path.lastIndexOf("/"), path.lastIndexOf("\\")) + 1);

    let lines = contents.asString().split(eol);
    let output = [];
    
    for (let line of lines) {
      if (line.indexOf(includeHeader) !== -1) {
        let match = includeExtract.exec(line);
        if (match) {
          let relativePath = folder + match[1];
          output.push(await this.parseShaderFile(relativePath));
          continue;
        }
      }

      output.push(line);
    }

    return output.join("\n");
  }
}