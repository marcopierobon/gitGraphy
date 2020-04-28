import MessagePrinter from "./MessagePrinter";
import * as vscode from "vscode";

const { exec } = require("child_process");

export default class CommitsRetriever {
  private static filesWithCommitsNumberArray: BarCharModel[] | undefined = undefined;
  static authorsPerFile: AuthorsPerFile[];

  static getContributorsPerFile(
    dir: string,
    skipNumberOfFiles: number,
    isHostAUnixBasedSystem: boolean
  ): Promise<AuthorsPerFile[]> | undefined{
    if (CommitsRetriever.authorsPerFile === undefined) {
      if (isHostAUnixBasedSystem) {
        const cmd = `cd "${dir}" && git log --numstat`;
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
              var authorsPerFileMap: Map<string, Authors> = new Map<
                string,
                Authors
              >();
              var stdOutWithNewLinesReplaced = stdout.replace(
                /(?:\r\n|\r|\n)/g,
                "<br>"
              );
              stdOutWithNewLinesReplaced+="<br>";
              var commitsArray: string[] = stdOutWithNewLinesReplaced.split(
                /commit [0-9a-f]{5,40}/gi
              );
              var authorRegExp = /<br>Author: ([^<]*)/i;
              var changedFilesRegExp = /<br>.*<br><br>(.*)<br><br>/;
              var individualFileChangeRegExp = /<br>/;
              var changedFileLineRegExp = /([-\d]*)\t([-\d]*)\t(.*)/;

              delete commitsArray[0];
              var index = 0;
              commitsArray.forEach((commit) => {
                var currentCommit = commit.substring(0, 10);
                console.log(currentCommit+ " Current iteration: " + ++index);
                MessagePrinter.printLine(currentCommit+ " Current iteration: " + index);
                vscode.window.showInformationMessage(currentCommit+ " Current iteration: " + index);
                var authorMatches = authorRegExp.exec(commit);
                if (authorMatches === null) {
                  throw new Error(
                    "Could not determine the commit author on the commit " +
                      commit
                  );
                }
                var currentAuthor = authorMatches[1];

                var commitSectionMatch = changedFilesRegExp.exec(commit);
                if (commitSectionMatch === null) {
                  throw new Error(
                    "Could not determine the committed files on the commit " +
                      commit
                  );
                }
                var includedFileChanges = commitSectionMatch[1].split(
                  individualFileChangeRegExp
                );
                includedFileChanges.forEach((changedFileLine) => {
                  var currentFileNameGroups = changedFileLineRegExp.exec(changedFileLine);
                  if (currentFileNameGroups === null) {
                    if(changedFileLine.toLowerCase().indexOf("Merge branch '")){
                      return;
                    }
                    throw new Error(
                      "Could not determine the filenames on the commit " +
                        commit
                    );
                  }
                  var currentFileName = currentFileNameGroups[3];
                  CommitsRetriever.upsertFileAndCommitter(
                    authorsPerFileMap,
                    currentFileName,
                    currentAuthor
                  );
                });
              });
              var authorsPerFile: AuthorsPerFile[] = [];
              authorsPerFileMap.forEach(function(val, key) {
                authorsPerFile.push({ filename: key, authors: val });
            });
              authorsPerFile.sort((n1: AuthorsPerFile, n2: AuthorsPerFile) =>
              n1.authors.numberOfAuthors > n2.authors.numberOfAuthors ? 1 : -1
            );
            CommitsRetriever.authorsPerFile = authorsPerFile;
              return resolve(authorsPerFile.slice(-10));
            }
          );
        });
      } 
      }
      return new Promise<AuthorsPerFile[]>((resolve) => {
        if(CommitsRetriever.authorsPerFile === undefined){
          throw new Error ("Could not get the files with their commits");
        }
        var arrayLength = CommitsRetriever.authorsPerFile.length;
        resolve(CommitsRetriever.authorsPerFile
          .slice(arrayLength - 10 - skipNumberOfFiles, arrayLength - skipNumberOfFiles));
      });
  }

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

  private static upsertFileAndCommitter(
    authorsPerFileMap: Map<string, Authors>,
    fileName: string,
    contributor: string
  ): void {
    if (!authorsPerFileMap.has(fileName)) {
      var authors: string[] = [];
      authors.push(contributor);
      var authorsPerFile: Authors = {
        authors: authors,
        numberOfAuthors: 1,
      };
      authorsPerFileMap.set(fileName, authorsPerFile);
    } else {
      var fileContributors = authorsPerFileMap.get(fileName);
      if (fileContributors === undefined) {
        throw new Error(
          "Could not find the data structure entry for " + fileName
        );
      }
      if (fileContributors.authors !== undefined) {
        if (!fileContributors.authors.includes(contributor)) {
          fileContributors.authors.push(contributor);
          fileContributors.numberOfAuthors++;
        }
      }
    }
  }
}
