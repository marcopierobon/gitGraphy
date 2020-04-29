const { exec } = require("child_process");

export default class FilesSizeRetriever {
  private static _fileSizeMultiplier = 1024;
  static filesWithSizesArray: string[] | undefined = undefined;
    
  public static getFilesSizes(
    dir: string,
    skipNumberOfFiles: number,
    isHostAUnixBasedSystem: boolean
  ): Promise<string[]> {
    if (FilesSizeRetriever.filesWithSizesArray === undefined) {
      if (isHostAUnixBasedSystem) {
        const cmd = `cd "${dir}" && git ls-files -z | xargs -0 ls -l -h -S | awk {'printf ("%s\\t%s\\n", $5, $9)'}`;
        //const cmd = `cd "${dir}" && git ls-files -z | xargs -0 ls -l -h -S | tail -n +${skipNumberOfFiles}  | head -n 10 | awk {'printf ("%s\\t%s\\n", $5, $9)'}`;
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
              FilesSizeRetriever.filesWithSizesArray = fileNameAndSizePairs;
              var lowestBoundary =
                skipNumberOfFiles <
                FilesSizeRetriever.filesWithSizesArray.length
                  ? skipNumberOfFiles
                  : FilesSizeRetriever.filesWithSizesArray.length;
              var upperBoundary = Math.min(
                FilesSizeRetriever.filesWithSizesArray.length,
                10 + skipNumberOfFiles
              );
              return resolve(
                FilesSizeRetriever.filesWithSizesArray.slice(
                  lowestBoundary,
                  upperBoundary
                )
              );
            }
          );
        });
      } else {
        dir = dir.replace(/\//g, "//").replace(/[\\]/g, "\\\\");
        const powershellCmd = `cd '${dir}'; git ls-tree -r -l --abbrev --full-name HEAD | Foreach {($_ -split '\\s+',4)[3,4]} |Sort-Object -Descending {[int]($_ -split "\\s+")[0]}  `;
        //const powershellCmd = `cd '${dir}'; git ls-tree -r -l --abbrev --full-name HEAD | Foreach {($_ -split '\\s+',4)[3,4]} |Sort-Object -Descending {[int]($_ -split "\\s+")[0]}  | Select-Object -Skip ${skipNumberOfFiles} -first 10 `;
        return new Promise((resolve, reject) => {
          exec(
            powershellCmd,
            { shell: "powershell.exe" },
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
                    fileSize: this.determineRightSizeSpecifier(data[0].trim()),
                    fileName: data[1].trim(),
                  };
                }
              );
              FilesSizeRetriever.filesWithSizesArray = fileNameAndSizePairs;
              var lowestBoundary =
                skipNumberOfFiles <
                FilesSizeRetriever.filesWithSizesArray.length
                  ? skipNumberOfFiles
                  : FilesSizeRetriever.filesWithSizesArray.length;
              var upperBoundary = Math.min(
                FilesSizeRetriever.filesWithSizesArray.length,
                10 + skipNumberOfFiles
              );
              return resolve(
                FilesSizeRetriever.filesWithSizesArray.slice(
                  lowestBoundary,
                  upperBoundary
                )
              );
            }
          );
        });
      }
    }

    return new Promise<string[]>((resolve) => {
      if (FilesSizeRetriever.filesWithSizesArray === undefined) {
        throw new Error("Could not get the files with their commits");
      }
      var lowestBoundary =
        skipNumberOfFiles < FilesSizeRetriever.filesWithSizesArray.length
          ? skipNumberOfFiles
          : FilesSizeRetriever.filesWithSizesArray.length;
      var upperBoundary = Math.min(
        FilesSizeRetriever.filesWithSizesArray.length,
        10 + skipNumberOfFiles
      );

      resolve(
        FilesSizeRetriever.filesWithSizesArray.slice(
          lowestBoundary,
          upperBoundary
        )
      );
    });
  }

  private static determineRightSizeSpecifier(fileSizeInBytes: string): string {
    var parsedNumber = Number(fileSizeInBytes);
    var fileSizeSpecifier = "b";
    if (parsedNumber > FilesSizeRetriever._fileSizeMultiplier) {
      parsedNumber = parsedNumber / 1024;
      fileSizeSpecifier = "k";
      if (parsedNumber > FilesSizeRetriever._fileSizeMultiplier) {
        parsedNumber = parsedNumber / 1024;
        fileSizeSpecifier = "m";
        if (parsedNumber > FilesSizeRetriever._fileSizeMultiplier) {
          parsedNumber = parsedNumber / 1024;
          fileSizeSpecifier = "g";
        }
      }
    }
    return (
      (Math.round(parsedNumber * 100) / 100).toFixed(2) + fileSizeSpecifier
    );
  }

  
}
