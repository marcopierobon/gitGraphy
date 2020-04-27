const { exec } = require("child_process");

export default class CommitsRetriever {
  private static filesWithCommitsNumberArray: BarCharModel[] | undefined = undefined;
  public static getAllCommitsPerAuthor(dir: string) : Promise<CommitsPerAuthor[]> {
    const cmd = `git -C "${dir}" shortlog -sn -e --all`;
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
          const lines : string[] = stdout.split(/\n/g).slice(0, -1);
          var repoTotalCommits: number = 0;

          lines.map((line: any) => {
            const userCommitsNumber:string = line.split("\t");
            if (userCommitsNumber !== null){
              repoTotalCommits += parseInt(userCommitsNumber[0].trim());
            }
          });

          var commitsForAllAuthors: CommitsPerAuthor[] = [];

          commitsForAllAuthors = lines.map((line: any) => {
            const data = line.split("\t");
            return {
              totalCommits: data[0].trim(),
              author: data[1].trim(),
              percentageOfAllCommits: (
                (data[0].trim() / repoTotalCommits) *
                100
              ).toFixed(2),
            };
          });
          return resolve(commitsForAllAuthors);
        }
      );
    });
  }

  public static getCommitsOnAllFiles(dir: string,
    skipNumberOfFiles: number) 
    : Promise<BarCharModel[]>{
    if(CommitsRetriever.filesWithCommitsNumberArray === undefined ){
    const cmd = `cd "${dir}" && git log --oneline --pretty="format:" --name-only`;
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
          const gitLogOutputLines = stdout.split(/\n/g).slice(0, -1);

          var numberOfChangesPerFileDict: LooseObject = {};

          for (
            var lineIndex: number = 0;
            lineIndex < gitLogOutputLines.length;
            lineIndex++
          ) {
            var currentChangedFile: string = gitLogOutputLines[lineIndex];
            if (numberOfChangesPerFileDict[currentChangedFile] === null ||
                numberOfChangesPerFileDict[currentChangedFile] === undefined) {
              numberOfChangesPerFileDict[currentChangedFile] = 1;
            } else {
              numberOfChangesPerFileDict[currentChangedFile]++;
            }
          }
          var numberOfChangesPerFileDictInPlotFormat: BarCharModel[] = [];

          Object.keys(numberOfChangesPerFileDict).forEach((element) => {
            if (
              numberOfChangesPerFileDict[element] <= 1 ||
              element === null || element === undefined ||
              element === ""
            ) {
              delete numberOfChangesPerFileDict[element];
            } else {
              var numberOfChangesPerFileDictInPlotFormatItem: BarCharModel = {
                label: element,
                occurrences: numberOfChangesPerFileDict[element],
              };
              numberOfChangesPerFileDictInPlotFormat.push(
                numberOfChangesPerFileDictInPlotFormatItem
              );
            }
          });

          numberOfChangesPerFileDictInPlotFormat = numberOfChangesPerFileDictInPlotFormat
            .sort((n1: BarCharModel, n2: BarCharModel) =>
              n1.occurrences > n2.occurrences ? 1 : -1
            );

            CommitsRetriever.filesWithCommitsNumberArray = numberOfChangesPerFileDictInPlotFormat;
            if(CommitsRetriever.filesWithCommitsNumberArray === undefined){
              throw new Error ("Could not get the files with their commits");
            }
            return resolve(CommitsRetriever.filesWithCommitsNumberArray.slice(-10));
        }
      );
      
    });
    
  }
  
  return new Promise<BarCharModel[]>((resolve) => {
    if(CommitsRetriever.filesWithCommitsNumberArray === undefined){
      throw new Error ("Could not get the files with their commits");
    }
    var arrayLength = CommitsRetriever.filesWithCommitsNumberArray.length;
    resolve(CommitsRetriever.filesWithCommitsNumberArray
      .slice(arrayLength - 10 - skipNumberOfFiles, arrayLength - skipNumberOfFiles));
  });
  }
}
