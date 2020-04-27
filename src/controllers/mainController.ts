import * as vscode from 'vscode';
import CommitsPanel from '../views/commits-panel/CommitsPanelView';
import CommitsPerFilePanel from '../views/commits-panel/CommitsPerFileView';
import CommitRetrieverService from '../services/CommitsRetriever';
import FilesSizeRetriever from '../services/FilesSizeRetriever';
import ConfigurationService from '../services/ConfigurationRetriever';
import MessagePrinter from '../services/MessagePrinter';
import WorkspaceDeterminer from '../services/WorkspaceDeterminer';
import SizePerFilePanel from '../views/commits-panel/SizePerFileView';

export default class {
  context:vscode.ExtensionContext;
  constructor (context:vscode.ExtensionContext) {
    this.context = context;
  }
  public async showCommitsPanel() {
    var selectedWorkspace = WorkspaceDeterminer.determineRightNamespaceToBeAnalysed();

    const config = ConfigurationService.getCommitChartConfiguration();
    try {
      const commitsPerAuthor = await CommitRetrieverService.getAllPerAuthor(selectedWorkspace || "");
      CommitsPanel.createOrShow(commitsPerAuthor, config, this.context);
    } catch(error) {
      MessagePrinter.printLine(error);
    }
  }

  public async showCommitsPerFilePanel() {
    
    var selectedWorkspace = WorkspaceDeterminer.determineRightNamespaceToBeAnalysed();
    const config = ConfigurationService.getCommitChartConfiguration();
    try {
      const commitsPerAuthor = await CommitRetrieverService.getCommitsOnAllFiles(selectedWorkspace || "");
      CommitsPerFilePanel.createOrShow(commitsPerAuthor, config, this.context);
    } catch(error) {
      MessagePrinter.printLine(error);
    }
  }

  public async showSizesPerFilePanel(isHostAUnixBasedSystem : boolean| undefined) {
    if(!isHostAUnixBasedSystem){
      const unsupportedHostOSMessage =  "At the moment determining the files with the biggest sizes " +
        "is only supported on *NIX based systems. " +
        "If this feature is important for you, please open a ticker at https://github.com/marcopierobon/gitGraphy";

        vscode.window.showInformationMessage(unsupportedHostOSMessage);
        MessagePrinter.printLine(unsupportedHostOSMessage);
        return;
    }
    var selectedWorkspace = WorkspaceDeterminer.determineRightNamespaceToBeAnalysed();
    const config = ConfigurationService.getCommitChartConfiguration();
    var skipNumberOfFiles = 0;
    try {
      const commitsPerAuthor = await FilesSizeRetriever.getSizesFiles(selectedWorkspace || "", skipNumberOfFiles);
      SizePerFilePanel.createOrShow(commitsPerAuthor, config, this.context);
    } catch(error) {
      MessagePrinter.printLine(error);
    }
  }
}