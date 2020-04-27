const { exec } = require("child_process");

export default class FilesSizeRetriever {
  public static getSizesFiles(
    dir: string,
    skipNumberOfFiles: number
  ): Promise<[string]> {
    const cmd = `cd "${dir}" && git ls-files -z | xargs -0 ls -l -h -S | tail -n +${skipNumberOfFiles}  | head -n 10 | awk {'printf ("%s\\t%s\\n", $5, $9)'}`;
    return new Promise((resolve, reject) => {
      exec(
        cmd,
        { maxBuffer: 1024 * 50 * 1000 },
        (err: any, stdout: any, stderr: any) => {
          if (err) {
            return reject(err);
          }
          if (stderr) {
            return reject(stderr);
          }
          const lines = stdout.split(/\n/g).slice(0, -1);

          const fileNameAndSizePairs: [string] = lines.map(
            (line: string) => {
              const data = line.split("\t");
              return {
                fileSize: data[0].trim(),
                fileName: data[1].trim(),
              };
            }
          );
          return resolve(fileNameAndSizePairs);
        }
      );
    });
  }
}
