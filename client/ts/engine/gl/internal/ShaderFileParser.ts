import { ShaderFileLoader } from "./loaders/ShaderFileLoader";
import { FileLoader } from "../../loaders/FileLoader";
import { GameContext } from "../../GameContext";

const eol = /\r?\n/;

const ENGINE_INCLUDES = [
  "env"
];


export class ShaderFileParser {
  private loader: FileLoader;
  private ctx: GameContext;
  private pathRecord: Set<string>;

  constructor(ctx: GameContext) {
    this.loader = ctx.getFileLoader();
    this.ctx = ctx;
  }

  async parseShaderFile(path: string) {
    this.pathRecord = new Set();
    return await this.parseShaderFile_(path);
  }

  private async parseShaderFile_(path: string) {
    if (this.pathRecord.has(path)) {
      console.info(path + " already included in program. Ignoring import...");
      return "";
    }

    this.pathRecord.add(path);
    const includeHeader = "#include "
    const includeExtract = /\s*#include\s+<?(.*)>.*/
    let contents = await this.loader.open(path);
    let folder = path.substring(0, Math.max(path.lastIndexOf("/"), path.lastIndexOf("\\")) + 1);

    const lines = contents.asString().split(eol);
    let output = [];
    
    for (let line of lines) {
      if (line.indexOf(includeHeader) !== -1) {
        console.info("Encountered new include: " + line);
        let match = includeExtract.exec(line);
        if (match !== null) {
          const path = match[1];
          console.log(path);
          if (ENGINE_INCLUDES.includes(path)) {
            console.log("OMG!!!");
            console.log(path);
            switch (path) {
              case "env":
                output.push(this.ctx.getShaderEnv());
                break;
            }

            continue;
          } else {
            const relativePath = folder + match[1];
            output.push(await this.parseShaderFile(relativePath));
            continue;
          }
        }
      }

      output.push(line);
    }

    return output.join("\n");
  }
}