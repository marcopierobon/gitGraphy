import * as vscode from 'vscode';
import FilesSizeRetriever from '../services/FilesSizeRetriever';
import ConfigurationService from '../services/ConfigurationRetriever';
import MessagePrinter from '../services/MessagePrinter';
import WorkspaceDeterminer from '../services/WorkspaceDeterminer';
import SizePerFilePanel from '../views/commits-panel/SizePerFileView';

export default class {
  context:vscode.ExtensionContext;
  _config: GraphConfig;
  constructor (context:vscode.ExtensionContext) {
    this.context = context;
    this.context = context;this._config = ConfigurationService.getCommitChartConfiguration();
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
    var skipNumberOfFiles = 0;
    try {
      const filesWithSize = await FilesSizeRetriever.getFilesSizes(selectedWorkspace || "", skipNumberOfFiles);
      SizePerFilePanel.createOrShow(filesWithSize, this._config, this.context);
    } catch(error) {
      MessagePrinter.printLine(error);
    }
  }
}