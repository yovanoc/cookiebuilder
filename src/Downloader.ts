import axios from "axios";
import { ControllablePromise, fetch, IFile } from "eway";
import { existsSync, unlinkSync } from "fs";
import { ListrTask } from "listr";

export default class Downloader {
  public static getDownloadTask(path: string): ListrTask {
    return {
      title: "Download latest DofusInvoker.swf",
      task: (ctx, task) => {
        const base = task.title;
        const render = (msg: string) => (task.title = `${base}: ${msg}`);
        return new Promise<void>(async (resolve, reject) => {
          const { handler, file } = await this.getDownload(path);

          handler()
            .onProgress(stats =>
              render(
                `${((stats.downloadedSize / file.size) * 100).toFixed(2)}%`
              )
            )
            .then(() => resolve())
            .catch(() => reject());
        });
      }
    };
  }

  public static async getDownload(
    path: string
  ): Promise<{ file: IFile; handler: () => ControllablePromise<void> }> {
    const res = await axios.get(`${Downloader.BASE_URL}/cytrus.json`);
    const json = res.data;
    const winVersion = json.Games.dofus.Platforms.windows.main;

    const gameVersionRes = await axios.get(
      `${Downloader.BASE_URL}/dofus/releases/main/windows/${winVersion}.json`
    );

    const { Hash, Size } = gameVersionRes.data.main.Files["DofusInvoker.swf"];

    if (existsSync(path)) {
      unlinkSync(path);
    }

    return {
      file: { hash: Hash, size: Size },
      handler: Downloader.getDownloadHandler({ hash: Hash, size: Size }, path)
    };
  }

  private static readonly BASE_URL = "https://ankama.akamaized.net/zaap/cytrus";

  private static getDownloadHandler(file: IFile, filepath: string) {
    const url = `${Downloader.BASE_URL}/dofus/hashes/${file.hash.slice(0, 2)}/${
      file.hash
    }`;
    return () => {
      const cp = fetch(url, filepath, file, true);
      return cp;
    };
  }
}
