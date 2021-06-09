import { ShaderFileLoader } from "./loaders/ShaderFileLoader";

export class ShaderFileParser {
  loader: ShaderFileLoader;
  pathRecord: Set<string>;

  constructor(loader: ShaderFileLoader) {
    this.loader = loader;
  }

  async parseShaderFile(path: string) {
    this.pathRecord = new Set();
    return await this.parseShaderFile_(path);
  }

  private async parseShaderFile_(path: string) {
    if (this.pathRecord.has(path)) {
      console.error("Circular reference detected on " + path + " -- terminating...");
      return "";
    }

    this.pathRecord.add(path);
    const includeHeader = "#include "
    const includeExtract = /\s*#include\s+<\"(.*)\">.*/g
    let contents = await this.loader.open(path);
    let folder = path.substring(0, path.lastIndexOf("/\\") + 1);

    let lines = contents.split("\n");
    let output = [];
    
    for (let line of lines) {
      if (line.indexOf(includeHeader) !== -1) {
        let match = includeExtract.exec(line);
        if (match) {
          console.log(match[1]);
          let relativePath = folder + match;
          console.log(relativePath);
          output.push(this.parseShaderFile(relativePath));
          continue;
        }
      }

      output.push(line);
    }

    return output.join("\n");
  }
}