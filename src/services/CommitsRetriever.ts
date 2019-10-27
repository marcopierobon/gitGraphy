const  { exec } = require("child_process");

export default class CommitsRetriever {
  public static getAllPerAuthor(dir:string) {
    const cmd = `git -C ${dir} shortlog -sn -e --all`;
    return new Promise((resolve, reject) => {
      exec(cmd, { maxBuffer: 1024 * 50 * 1000 },  (err: any, stdout: any, stderr: any) => {
        if (err) {
          return reject(err);
        }
        if (stderr) {
          return reject(stderr);
        }
        const lines = stdout.split(/\n/g).slice(0, -1);
        var repoTotalCommits: number = 0;


        lines.map((line:any) => {
          const data = line.split('\t');
          if(data != null)
            repoTotalCommits += parseInt(data[0].trim());
        });

        const commitsPerFile = lines.map((line:any) => {
          const data = line.split('\t');
          return {
            totalCommits: data[0].trim(),
            author: data[1].trim() ,
            percentageOfAllCommits:(data[0].trim()/repoTotalCommits * 100).toFixed(2)
          };
        });
        return resolve(commitsPerFile);
      });
    });
  }


  public static getCommitsOnAllFiles(dir:string) {
    interface LooseObject {
        [key: string]: number
    }

    interface BarCharItem {
      label: string;
      occurrences: number;
  }

    const cmd = `cd ${dir} && git log --oneline --pretty="format:" --name-only`;
    return new Promise((resolve, reject) => {
      exec(cmd, { maxBuffer: 1024 * 50 * 1000 },  (err: any, stdout: any, stderr: any) => {
        if (err) {
          return reject(err);
        }
        if (stderr) {
          return reject(stderr);
        }
        const gitLogOutputLines = stdout.split(/\n/g).slice(0, -1);
        
        var numberOfChangesPerFileDict: LooseObject = {};

        for(var lineIndex:number = 0; lineIndex < gitLogOutputLines.length; lineIndex++)
        {
            var currentChangedFile: string = gitLogOutputLines[lineIndex];
              if(numberOfChangesPerFileDict[currentChangedFile] == null){
                numberOfChangesPerFileDict[currentChangedFile] = 1;
              }
              else{
                numberOfChangesPerFileDict[currentChangedFile]++;
              }
        }
        var numberOfChangesPerFileDictInPlotFormat: BarCharItem[] = [];

        Object.keys(numberOfChangesPerFileDict)
          .forEach(element => {
            if(numberOfChangesPerFileDict[element] <= 1 || element == null || element == ""){
              delete numberOfChangesPerFileDict[element];
            }
            else{
              var numberOfChangesPerFileDictInPlotFormatItem: BarCharItem = {
                label: element,
                occurrences: numberOfChangesPerFileDict[element]
            };
            numberOfChangesPerFileDictInPlotFormat.push(numberOfChangesPerFileDictInPlotFormatItem);
            }
          });

          numberOfChangesPerFileDictInPlotFormat = numberOfChangesPerFileDictInPlotFormat
          .sort((n1:BarCharItem,n2:BarCharItem) => (n1.occurrences > n2.occurrences) ? -1 : 1)
          .slice(0, 9);

        return resolve(numberOfChangesPerFileDictInPlotFormat);
      });
    });
  }
}