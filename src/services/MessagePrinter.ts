import * as vscode from 'vscode';

export default class {
  private static outputChannel:vscode.OutputChannel = vscode.window.createOutputChannel("Git Graphy");
  static printLine(message:string) {
    this.outputChannel.appendLine(message);
  }
  static print(message:string) {
    this.outputChannel.append(message);
  }
}