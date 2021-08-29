import { FileLike } from "./FileLike";
import { FileLikeWeb } from "./internal/FileLikeWeb";

/**
 * Provides a convenient wrapper for loading files.
 * Tracks loading progress of a particular file.
 */
export class FileLoader {

  private loadedFiles: Map<string, FileLikeWeb>;

  constructor() {
    console.log("all good");
    this.loadedFiles = new Map();
  }

  async open(path: string) : Promise<FileLike> {

    
    let res : FileLikeWeb;
    
    if (this.loadedFiles.has(path)) {
      res = this.loadedFiles.get(path);
    } else {
      let resp = fetch(path);
      res = new FileLikeWeb(resp);
      this.loadedFiles.set(path, res);
    }

    await res.waitUntilReady();
    return res;
  }

  getFractionLoaded() : number {
    let files = 0;
    let filesLoaded = 0;

    if (this.loadedFiles.size === 0) {
      return 1;
    }

    for (let file of this.loadedFiles) {
      files++;
      if (file[1].ready()) {
        filesLoaded++;
      }
    }

    return (filesLoaded / files);
  }
}

// focus on single scene right now -- i'm pretty sure that should be fine.

// rather than transitioning between scenes, we'll use webpages to implement that.