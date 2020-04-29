import * as vscode from 'vscode';
import FilesSizeRetriever from '../services/FilesSizeRetriever';
import ConfigurationService from '../services/ConfigurationRetriever';
import MessagePrinter from '../services/MessagePrinter';
import WorkspaceDeterminer from '../services/WorkspaceDeterminer';
import SizePerFilePanel from '../views/files-sizes-panel/SizePerFileView';
import CommitsRetriever from '../services/CommitsRetriever';

export default class {
  context:vscode.ExtensionContext;
  _config: GraphConfig;
  constructor (context:vscode.ExtensionContext) {
    this.context = context;
    this.context = context;this._config = ConfigurationService.getCommitChartConfiguration();
  }

  public async showSizesPerFilePanel(isHostAUnixBasedSystem : boolean| undefined) {
    if(isHostAUnixBasedSystem === undefined){
        const couldNotDetermineTheOs = "Could not determine the os";
        vscode.window.showInformationMessage(couldNotDetermineTheOs);
        MessagePrinter.printLine(couldNotDetermineTheOs);
        return;
    }
    var selectedWorkspace = WorkspaceDeterminer.determineRightNamespaceToBeAnalysed();
    var skipNumberOfFiles = 0;
    try {
      const filesWithSize = await FilesSizeRetriever.getFilesSizes(selectedWorkspace || "", skipNumberOfFiles, isHostAUnixBasedSystem);
      SizePerFilePanel.createOrShow(filesWithSize, this._config, this.context, isHostAUnixBasedSystem);
    } catch(error) {
      MessagePrinter.printLine(error);
    }
  }
}