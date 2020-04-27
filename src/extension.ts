import * as vscode from "vscode";
import CommitController from './controllers/commitController';
import FileController from './controllers/fileController';
const  { exec } = require("child_process");

let isHostAUnixBasedSystem : boolean| undefined = undefined;

export function activate(context: vscode.ExtensionContext) {
  if(isHostAUnixBasedSystem == undefined){
    getHostType().then((value) => {
      isHostAUnixBasedSystem = value
    });
  }
  const commitController = new CommitController(context);
  const fileController = new FileController(context);
  let viewCommitsDisposable = vscode.commands.registerCommand("GitGraphy.viewCommits",() => {
    commitController.showCommitsPanel();
  });
  let viewCommitsPerFileDisposable = vscode.commands.registerCommand("GitGraphy.viewCommitsPerFile",() => {
    commitController.showCommitsPerFilePanel();
  });
  let viewsizessPerFileDisposable = vscode.commands.registerCommand("GitGraphy.viewSizePerFile",() => {
    fileController.showSizesPerFilePanel(isHostAUnixBasedSystem);
  });
  context.subscriptions.push(viewCommitsDisposable);
  context.subscriptions.push(viewCommitsPerFileDisposable);
  context.subscriptions.push(viewsizessPerFileDisposable);
}
function getHostType(): Promise<boolean> {
  const cmd = `ls`;
  return new Promise((resolve, reject) => {
    exec(cmd, { maxBuffer: 1024 * 50 * 1000 },  (err: any, stdout: any, stderr: any) => {
      if (err) {
        isHostAUnixBasedSystem = false;
      }
      if (stderr) {
        isHostAUnixBasedSystem = false;
      }
      isHostAUnixBasedSystem = true;
    });
    return isHostAUnixBasedSystem;
  });
}

export function deactivate() {}
