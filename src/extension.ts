import * as vscode from "vscode";
import Controller from './controllers/mainController';
const  { exec } = require("child_process");

let isHostAUnixBasedSystem : boolean| undefined = undefined;

export function activate(context: vscode.ExtensionContext) {
  if(isHostAUnixBasedSystem == undefined){
    getHostType().then((value) => {
      isHostAUnixBasedSystem = value
    });
  }
  const controller = new Controller(context);
  let viewCommitsDisposable = vscode.commands.registerCommand("GitGraphy.viewCommits",() => {
    controller.showCommitsPanel();
  });
  let viewCommitsPerFileDisposable = vscode.commands.registerCommand("GitGraphy.viewCommitsPerFile",() => {
    controller.showCommitsPerFilePanel();
  });
  let viewsizessPerFileDisposable = vscode.commands.registerCommand("GitGraphy.viewSizePerFile",() => {
    controller.showSizesPerFilePanel(isHostAUnixBasedSystem);
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
