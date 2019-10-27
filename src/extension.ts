import * as vscode from "vscode";
import Controller from './controllers/mainController';

export function activate(context: vscode.ExtensionContext) {
  const controller = new Controller(context);
  let viewCommitsDisposable = vscode.commands.registerCommand("GitGraphy.viewCommits",() => {
    controller.showCommitsPanel();
  });
  let viewCommitsPerFileDisposable = vscode.commands.registerCommand("GitGraphy.viewCommitsPerFile",() => {
    controller.showCommitsPerFilePanel();
  });
  context.subscriptions.push(viewCommitsDisposable);
  context.subscriptions.push(viewCommitsPerFileDisposable);
}

export function deactivate() {}
