import * as vscode from 'vscode';
import CommitsPanel from '../views/commits-panel/CommitsPanelView';
import CommitsPerFilePanel from '../views/commits-panel/CommitsPerFileView';
import CommitRetrieverService from '../services/CommitsRetriever';
import ConfigurationService from '../services/ConfigurationRetriever';
import MessagePrinter from '../services/MessagePrinter';
import WorkspaceDeterminer from '../services/WorkspaceDeterminer';
import { isBlank } from '../utils';

export default class {
  context:vscode.ExtensionContext;
  constructor (context:vscode.ExtensionContext) {
    this.context = context;
  }
  public async showCommitsPanel() {
    var selectedWorkspace = WorkspaceDeterminer.determineRightNamespaceToBeAnalysed();

    const config = ConfigurationService.getCommitChartConfiguration();
    try {
      const comitsPerAuthor = await CommitRetrieverService.getAllPerAuthor(selectedWorkspace || "");
      CommitsPanel.createOrShow(comitsPerAuthor, config, this.context);
    } catch(error) {
      MessagePrinter.printLine(error);
    }
  }

  public async showCommitsPerFilePanel() {
    
    var selectedWorkspace = WorkspaceDeterminer.determineRightNamespaceToBeAnalysed();
    const config = ConfigurationService.getCommitChartConfiguration();
    try {
      const comitsPerAuthor = await CommitRetrieverService.getCommitsOnAllFiles(selectedWorkspace || "");
      CommitsPerFilePanel.createOrShow(comitsPerAuthor, config, this.context);
    } catch(error) {
      MessagePrinter.printLine(error);
    }
  }
}