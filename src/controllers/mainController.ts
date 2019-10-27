import * as vscode from 'vscode';
import CommitsPanel from '../views/commits-panel/CommitsPanelView';
import CommitsPerFilePanel from '../views/commits-panel/CommitsPerFileView';
import CommitRetrieverService from '../services/CommitsRetriever';
import ConfigurationService from '../services/ConfigurationRetriever';
import MessagePrinter from '../services/MessagePrinter';
import { isBlank } from '../utils';

export default class {
  context:vscode.ExtensionContext;
  constructor (context:vscode.ExtensionContext) {
    this.context = context;
  }
  public async showCommitsPanel() {
    if(isBlank(vscode.workspace.rootPath)) {
      vscode.window.showInformationMessage('Please open a workspace');
      return;
    }
    const config = ConfigurationService.getCommitChartConfiguration();
    try {
      const comitsPerAuthor = await CommitRetrieverService.getAllPerAuthor(vscode.workspace.rootPath || "");
      CommitsPanel.createOrShow(comitsPerAuthor, config, this.context);
    } catch(error) {
      MessagePrinter.printLine(error);
    }
  }

  public async showCommitsPerFilePanel() {
    if(isBlank(vscode.workspace.rootPath)) {
      vscode.window.showInformationMessage('Please open a workspace');
      return;
    }
    const config = ConfigurationService.getCommitChartConfiguration();
    try {
      const comitsPerAuthor = await CommitRetrieverService.getCommitsOnAllFiles(vscode.workspace.rootPath || "");
      CommitsPerFilePanel.createOrShow(comitsPerAuthor, config, this.context);
    } catch(error) {
      MessagePrinter.printLine(error);
    }
    
  }
}