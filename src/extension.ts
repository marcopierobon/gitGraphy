import * as vscode from "vscode";
import Controller from './controllers/mainController';

export function activate(context: vscode.ExtensionContext) {
  const controller = new Controller(context);
  let viewCommitsDisposable = vscode.commands.registerCommand("GitStats.viewCommits",() => {
    controller.showCommitsPanel();
  });
  let viewCommitsByAuthorDisposable = vscode.commands.registerCommand("GitStats.viewCommitsByAuthor",() => {
    controller.showCommitsByAuthorPanel();
  });
  context.subscriptions.push(viewCommitsDisposable);
  context.subscriptions.push(viewCommitsByAuthorDisposable);
}

export function deactivate() {}
