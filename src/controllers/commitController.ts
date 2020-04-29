import * as vscode from 'vscode';
import CommitsPanel from '../views/commits-panel/CommitsPanelView';
import CommitsPerFilePanel from '../views/commits-panel/CommitsPerFileView';
import CommitRetrieverService from '../services/CommitsRetriever';
import ConfigurationService from '../services/ConfigurationRetriever';
import MessagePrinter from '../services/MessagePrinter';
import WorkspaceDeterminer from '../services/WorkspaceDeterminer';
import CommitsRetriever from '../services/CommitsRetriever';
import ContributorsPerFilePanel from '../views/commits-panel/ContributorsPerFileView';

export default class {
  context:vscode.ExtensionContext;
  _config: GraphConfig;
  constructor (context:vscode.ExtensionContext) {
    this.context = context;
    this._config = ConfigurationService.getCommitChartConfiguration();
  }

  public async showContributorsPerFilePanel(isHostAUnixBasedSystem: boolean | undefined) {
    if(isHostAUnixBasedSystem === undefined){
      const couldNotDetermineTheOs = "Could not determine the os";
      vscode.window.showInformationMessage(couldNotDetermineTheOs);
      MessagePrinter.printLine(couldNotDetermineTheOs);
      return;
    }
    var selectedWorkspace = WorkspaceDeterminer.determineRightNamespaceToBeAnalysed();
    var skipNumberOfFiles = 0;
    try {
      const filesWithSize = await CommitsRetriever.getContributorsPerFile(selectedWorkspace || "", skipNumberOfFiles, isHostAUnixBasedSystem);
      ContributorsPerFilePanel.createOrShow(filesWithSize, this._config, this.context, isHostAUnixBasedSystem);
    } catch(error) {
      MessagePrinter.printLine(error);
    }
  }

  public async showCommitsPanel() {
    var selectedWorkspace = WorkspaceDeterminer.determineRightNamespaceToBeAnalysed();

    try {
      const commitsPerAuthor = await CommitRetrieverService.getAllCommitsPerAuthor(selectedWorkspace || "");
      CommitsPanel.createOrShow(commitsPerAuthor, this._config, this.context);
    } catch(error) {
      MessagePrinter.printLine(error);
    }
  }

  public async showCommitsPerFilePanel() {
    
    var skipNumberOfFiles = 0;
    var selectedWorkspace = WorkspaceDeterminer.determineRightNamespaceToBeAnalysed();
    try {
      const commitsPerAuthor = await CommitRetrieverService.getCommitsOnAllFiles(selectedWorkspace || "", skipNumberOfFiles);
      CommitsPerFilePanel.createOrShow(commitsPerAuthor, this._config, this.context);
    } catch(error) {
      MessagePrinter.printLine(error);
    }
  }
}