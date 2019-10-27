import * as vscode from 'vscode';
import CommitsPanel from '../views/commits-panel/CommitsPanel';
import CommitsByAuthorPanel from '../views/commits-panel/CommitsByAuthorPanel';
import CommitRetrieverService from '../services/Commit';
import ConfigurationService from '../services/Configuration';
import OutputService from '../services/Output';
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
      OutputService.printLine(error);
    }
    
  }

  public async showCommitsByAuthorPanel() {
    if(isBlank(vscode.workspace.rootPath)) {
      vscode.window.showInformationMessage('Please open a workspace');
      return;
    }
    const config = ConfigurationService.getCommitChartConfiguration();
    try {
      const comitsPerAuthor = await CommitRetrieverService.getCommitsOnAllFiles(vscode.workspace.rootPath || "");
      CommitsByAuthorPanel.createOrShow(comitsPerAuthor, config, this.context);
    } catch(error) {
      OutputService.printLine(error);
    }
    
  }
}