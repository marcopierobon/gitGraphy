import * as vscode from "vscode";
import * as path from "path";
import Constants from "../../utils/constants";
import MessagePrinter from "../../services/MessagePrinter";
import WorkspaceDeterminer from "../../services/WorkspaceDeterminer";
import ButtonActions from "../../models/commands/ButtonActions";
import CommitsRetriever from "../../services/CommitsRetriever";

export default class ContributorsPerFilePanel {
  public static currentPanel: ContributorsPerFilePanel | undefined;

  private readonly _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];
  private static currentFilesBeingSkipped = 0;
  private static yAxisIntervalsScale = 5;

  public static createOrShow(
    commitsPerFile: AuthorsPerFile[] | undefined,
    config: GraphConfig,
    context: vscode.ExtensionContext,
    isHostAUnixBasedSystem: boolean
  ) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;
    if (ContributorsPerFilePanel.currentPanel) {
      ContributorsPerFilePanel.currentPanel._panel.reveal(column);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      "FileContributorsPanel",
      "View File Contributors",
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
      }
    );

    const ChartJSFilePath = vscode.Uri.file(
      path.join(context.extensionPath, "resources", "Chart.bundle.min.js")
    );

    const ChartJSSrc = ChartJSFilePath.with({ scheme: "vscode-resource" });
    ContributorsPerFilePanel.currentPanel = new ContributorsPerFilePanel(
      panel,
      commitsPerFile,
      config,
      ChartJSSrc,
      isHostAUnixBasedSystem
    );
  }

  private constructor(
    panel: vscode.WebviewPanel,
    commitsPerFile: AuthorsPerFile[] | undefined,
    config: GraphConfig,
    ChartJSSrc: vscode.Uri,
    isHostAUnixBasedSystem: boolean
  ) {
    this._panel = panel;
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    const webViewContent = this.getWebviewContent(
      commitsPerFile,
      config,
      ChartJSSrc
    );
    this._panel.webview.html = webViewContent;
    this._panel.webview.onDidReceiveMessage(
      async (message: { command: string }) => {
        let filesWithSizes: AuthorsPerFile[] | undefined = undefined;
        var selectedWorkspace = WorkspaceDeterminer.determineRightNamespaceToBeAnalysed();
        var isReDrawNecessary = false;

        switch (message.command) {
          case ButtonActions.Previous:
            if(CommitsRetriever.authorsPerFileOrdered !== undefined &&
              ContributorsPerFilePanel.currentFilesBeingSkipped + 20 <
              CommitsRetriever.authorsPerFileOrdered.length){
              ContributorsPerFilePanel.currentFilesBeingSkipped += 10;
              filesWithSizes = await CommitsRetriever.getContributorsPerFile(
                selectedWorkspace || "",
                ContributorsPerFilePanel.currentFilesBeingSkipped
              );
              MessagePrinter.printLine("Previous files shown");
              isReDrawNecessary = true;
            }
            else{
              vscode.window.showInformationMessage(
                "You are already seeing the files with the least contributors in the repository. "
              );
            }
            break;
          case ButtonActions.Next:
            if (ContributorsPerFilePanel.currentFilesBeingSkipped >= 10) {
              ContributorsPerFilePanel.currentFilesBeingSkipped -= 10;
              filesWithSizes = await CommitsRetriever.getContributorsPerFile(
                selectedWorkspace || "",
                ContributorsPerFilePanel.currentFilesBeingSkipped
              );
              isReDrawNecessary = true;
            } else {
              vscode.window.showInformationMessage(
                "You are already seeing the files with the most contributors in the repository. "
              );
            }
            break;
          default:
            throw new Error(
              "The message of type " + message.command + " was not expected"
            );
        }
        if (isReDrawNecessary) {
          const webViewContent = this.getWebviewContent(
            filesWithSizes,
            config,
            ChartJSSrc
          );
          this._panel.webview.html = webViewContent;
        }
      },
      undefined,
      undefined
    );
  }

  scaleDataAndRemoveSizeFormatter(
    data: AuthorsPerFile[]
  ): GraphDataModelWithAdditionalLabelInfo {
    var numbersToBeGraphed = data.map((fileWithAuthors) => {
      return fileWithAuthors.numberOfAuthors;
    });
    var labelsGraphed = data.map((fileWithAuthors) => {
      return this.compileOccurrentInfo(fileWithAuthors.filename);
    });
    var optionalAdditionalLabelInformation = data.map((fileWithAuthors) => {
      return this.compileOccurrentInfo(fileWithAuthors.authors.join("\n"));
    });

    var maxGraphValueYAxis =
      Math.ceil(
        (numbersToBeGraphed[numbersToBeGraphed.length - 1] * 1.1) /
          ContributorsPerFilePanel.yAxisIntervalsScale
      ) * ContributorsPerFilePanel.yAxisIntervalsScale;
    var stepSizeYAxis = Math.floor(
      maxGraphValueYAxis / ContributorsPerFilePanel.yAxisIntervalsScale
    );

    return {
      numbersToBeGraphedSpecifier: "contributors",
      optionalAdditionalLabelInformation: optionalAdditionalLabelInformation,
      numbersToBeGraphed: numbersToBeGraphed,
      dataLabels: labelsGraphed,
      maxGraphValueYAxis: maxGraphValueYAxis,
      stepSizeYAxis: stepSizeYAxis,
    };
  }

  private compileOccurrentInfo(stringToIncludeInApostophe: any): string {
    return `'${stringToIncludeInApostophe}'`;
  }

  private getWebviewContent(
    authorsPerFile: AuthorsPerFile[] | undefined,
    config: GraphConfig,
    ChartJSSrc: vscode.Uri
  ) {
    if (authorsPerFile === undefined) {
      return "";
    }
    let filesSizesGraphModel: GraphDataModelWithAdditionalLabelInfo = this.scaleDataAndRemoveSizeFormatter(
      authorsPerFile
    );
    if (filesSizesGraphModel.numbersToBeGraphed === undefined) {
      throw new Error("The values to be displayed were not set");
    }

    const bodyStyle =
      config.width !== undefined &&
      config.width > 0 &&
      config.height !== undefined &&
      config.height > 0
        ? `body { 
      width:  ${config.width}px; 
      height: ${config.height}px}; 
      margin-top: 150px; 
      margin-left: 150px;`
        : "";
    return `<!DOCTYPE html>
          <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body>
            <br/>
            <div align="center">
              <button onclick="showPrevious()">Display files with fewer contributors</button>
              <button onclick="showNext()">Display files with more contributors</button>
            </div>
              <canvas id="myChart"></canvas>
              <script src="${ChartJSSrc}"></script>
              <script>
                const vscode = acquireVsCodeApi();
                (function init() {
                  document.vscode = vscode;
                })();
              </script>
              <script>
                var ctx = document.getElementById('myChart');
                var chart = new Chart(ctx, {
                  type: 'bar',
                  data: {
                    labels: [${filesSizesGraphModel.dataLabels}],
                    datasets: [{
                        label: 'X',
                        data: [${filesSizesGraphModel.numbersToBeGraphed}],
                        borderWidth: 2,
                        backgroundColor: ${Constants.colors}
                    }]
                  },
                  options: {
                    scales: {
                      xAxes: [{
                        ticks: {
                          callback: function(value) {
                            var valueToTruncate = value;
                            if (value.indexOf("/") >= 0) {
                              valueToTruncate = 
                                value.substring(value.lastIndexOf("/") + 1, value.length);
                            } 
                            if(valueToTruncate.length > 10) {
                              var valueBeforeDots = valueToTruncate.substring(0, 5);
                              var valueAfterDots = valueToTruncate.substring(valueToTruncate.length - 1 - 3, valueToTruncate.length);
                              valueToTruncate =  valueBeforeDots + ".." + valueAfterDots;
                            }
                            return valueToTruncate;
                          },
                        }
                      }],
                      yAxes: [{
                        ticks: {
                          beginAtZero: true,
                          min: 0,
                          max: ${filesSizesGraphModel.maxGraphValueYAxis},
                          stepSize: ${filesSizesGraphModel.stepSizeYAxis},
                          callback: function(value, index, values) {
                              return value +  ' ${filesSizesGraphModel.numbersToBeGraphedSpecifier}'
                          }
                        }
                      }]
                    },
                    tooltips: {
                      enabled: true,
                      mode: 'label',
                      callbacks: {
                        title: function(tooltipItems, data) {
                          var idx = tooltipItems[0].index;
                          return data.labels[idx]; 
                        },
                        label: function(tooltipItem, data) {
                          return data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index] + ' ${filesSizesGraphModel.numbersToBeGraphedSpecifier}';
                        }
                      }
                    },
                    maintainAspectRatio: true,
                    backgroundColor: '#c1c1c1',
                    responsive: true,
                    legend: {
                      display: true,
                      position: '${config.legendPosition}',
                      fontColor: 'rgb(255, 99, 132)',
                      labels: {
                        generateLabels: function(chart) {
                            var data = chart.data;
                            if (data.labels.length && data.datasets.length) {
                                return data.labels.map(function(label, i) {
                                    var meta = chart.getDatasetMeta(0);
                                    var ds = data.datasets[0];
                                    var arc = meta.data[i];
                                    var custom = arc && arc.custom || {};
                                    var getValueAtIndexOrDefault = Chart.helpers.getValueAtIndexOrDefault;
                                    var arcOpts = chart.options.elements.arc;
                                    var fill = custom.backgroundColor ? custom.backgroundColor : getValueAtIndexOrDefault(ds.backgroundColor, i, arcOpts.backgroundColor);
                                    var stroke = custom.borderColor ? custom.borderColor : getValueAtIndexOrDefault(ds.borderColor, i, arcOpts.borderColor);
                                    var bw = custom.borderWidth ? custom.borderWidth : getValueAtIndexOrDefault(ds.borderWidth, i, arcOpts.borderWidth);

                                    if (label.indexOf("/") >= 0) {
                                      label = 
                                        label.substring(label.lastIndexOf("/") + 1, label.length);
                                    } 
        
                                    return {
                                        // We add the value to the string
                                        text: label ,
                                        fillStyle: fill,
                                        strokeStyle: stroke,
                                        lineWidth: bw,
                                        hidden: isNaN(ds.data[i]) || meta.data[i].hidden,
                                        index: i
                                    };
                                });
                            } else {
                                return [];
                            }
                        }
                    }
                    }
                  }
                });
                function showPrevious(){
                  vscode.postMessage({command: '${ButtonActions.Previous}'})
                }
                function showNext(){
                  vscode.postMessage({command: '${ButtonActions.Next}'})
                }
              </script>
            </body>
            <br><br>
            <style>
              ${bodyStyle}
              body.vscode-light .username, body.vscode-light .password {
                color: #616466;
              }
              body.vscode-dark .username, body.vscode-dark .password {
                color: #C2C7CC;
              }
            </style>
          </html>`;
  }

  public dispose() {
    ContributorsPerFilePanel.currentPanel = undefined;
    // Clean up our resources
    this._panel.dispose();

    while (this._disposables.length) {
      const panel = this._disposables.pop();
      if (panel) {
        panel.dispose();
      }
    }
  }
}
