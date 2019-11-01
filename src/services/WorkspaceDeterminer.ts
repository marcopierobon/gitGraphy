import * as vscode from 'vscode';

export default class WorkspaceDeterminer{
  public static determineRightNamespaceToBeAnalysed() : string {
    var selectedWorkspace = "";
    if(vscode.workspace.workspaceFolders === undefined ||
      vscode.workspace.workspaceFolders.length === 0) {
      vscode.window.showInformationMessage('Please open a workspace.');
    }
    else if(vscode.workspace.workspaceFolders.length === 1) {
      selectedWorkspace = vscode.workspace.workspaceFolders[0].uri.fsPath;
    }
    else if(vscode.workspace.workspaceFolders.length > 1) {
      if(vscode.window.activeTextEditor === undefined ||
        vscode.window.activeTextEditor.document === undefined ||
        (vscode.workspace.getWorkspaceFolder(vscode.window.activeTextEditor.document.uri) == undefined)){
        vscode.window.showInformationMessage("You have multiple workspaces open, " +
        "but no file in the editor. Either close all workspaces and leave only one, " +
        "or open a file from the desired workspace.");
        return "";
      }
      
      var workspaceForOpenFile = vscode.workspace.getWorkspaceFolder(vscode.window.activeTextEditor.document.uri);

      if(workspaceForOpenFile === undefined){
        vscode.window.showInformationMessage("Could not determine the right namespace for the current tab. " +
        "Try leaving only one namespace open.");
        return "";
      }
        selectedWorkspace = workspaceForOpenFile.uri.fsPath;
    }
    return selectedWorkspace;
  }
}