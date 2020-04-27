import * as vscode from 'vscode';
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