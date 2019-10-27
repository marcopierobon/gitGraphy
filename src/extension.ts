import * as vscode from "vscode";
import Controller from './controllers/mainController';

export function activate(context: vscode.ExtensionContext) {
  const controller = new Controller(context);
  let viewCommitsDisposable = vscode.commands.registerCommand("GitStats.viewCommits",() => {
    controller.showCommitsPanel();
  });
  let viewCommitsPerFileDisposable = vscode.commands.registerCommand("GitStats.viewCommitsPerFile",() => {
    controller.showCommitsPerFilePanel();
  });
  context.subscriptions.push(viewCommitsDisposable);
  context.subscriptions.push(viewCommitsPerFileDisposable);
}

export function deactivate() {}
