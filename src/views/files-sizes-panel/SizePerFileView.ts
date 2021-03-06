import * as vscode from "vscode";
import * as path from "path";
import Constants from "../../utils/constants";
import MessagePrinter from "../../services/MessagePrinter";
import FilesSizeRetriever from "../../services/FilesSizeRetriever";
import WorkspaceDeterminer from "../../services/WorkspaceDeterminer";
import ButtonActions from "../../models/commands/ButtonActions";

export default class SizePerFilePanel {
  private static _fileSizeMultiplier = 1024;
  public static currentPanel: SizePerFilePanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];
  private static currentFilesBeingSkipped = 0;
  private static yAxisIntervalsScale = 10;

  public static createOrShow(
    commitsPerFile: string[],
    config: GraphConfig,
    context: vscode.ExtensionContext,
    isHostAUnixBasedSystem: boolean
  ) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;
    if (SizePerFilePanel.currentPanel) {
      SizePerFilePanel.currentPanel._panel.reveal(column);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      "FileSizePanel",
      "View File Sizes",
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
      }
    );

    const ChartJSFilePath = vscode.Uri.file(
      path.join(context.extensionPath, "resources", "Chart.bundle.min.js")
    );

    const ChartJSSrc = ChartJSFilePath.with({ scheme: "vscode-resource" });
    SizePerFilePanel.currentPanel = new SizePerFilePanel(
      panel,
      commitsPerFile,
      config,
      ChartJSSrc,
      isHostAUnixBasedSystem
    );
  }

  private constructor(
    panel: vscode.WebviewPanel,
    commitsPerFile: string[],
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
        let filesWithSizes: string[] | undefined = undefined;
        var selectedWorkspace = WorkspaceDeterminer.determineRightNamespaceToBeAnalysed();
        var isReDrawNecessary = false;

        switch (message.command) {
          case ButtonActions.Previous:
            if (
              FilesSizeRetriever.filesWithSizesArray !== undefined &&
              SizePerFilePanel.currentFilesBeingSkipped + 10 <
                FilesSizeRetriever.filesWithSizesArray.length
            ) {
              SizePerFilePanel.currentFilesBeingSkipped += 10;
              filesWithSizes = await FilesSizeRetriever.getFilesSizes(
                selectedWorkspace || "",
                SizePerFilePanel.currentFilesBeingSkipped,
                isHostAUnixBasedSystem
              );
              MessagePrinter.printLine("Previous files shown");
              isReDrawNecessary = true;
            } else {
              vscode.window.showInformationMessage(
                "You are already seeing the smallest files in the repository. "
              );
            }
            break;
          case ButtonActions.Next:
            if (SizePerFilePanel.currentFilesBeingSkipped >= 10) {
              SizePerFilePanel.currentFilesBeingSkipped -= 10;
              filesWithSizes = await FilesSizeRetriever.getFilesSizes(
                selectedWorkspace || "",
                SizePerFilePanel.currentFilesBeingSkipped,
                isHostAUnixBasedSystem
              );
              isReDrawNecessary = true;
            } else {
              vscode.window.showInformationMessage(
                "You are already seeing the biggest files in the repository. "
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

  scaleDataAndRemoveSizeFormatter(data: any): GraphDataModel {
    var sizeMultipliers = [
      { name: "b" },
      { name: "k" },
      { name: "m" },
      { name: "g" },
    ];
    let scaleDifferenceBetweenSmallestAndBiggestFileSizes = 0;
    if (
      data === null ||
      data.length === 0 ||
      data[0] === null ||
      data[data.length - 1] === null
    ) {
      return {
        numbersToBeGraphedSpecifier: undefined,
        numbersToBeGraphed: undefined,
        dataLabels: undefined,
        maxGraphValueYAxis: undefined,
        stepSizeYAxis: undefined,
      };
    }
    var biggestElementSizeSpecifier = data[0][data[0].length - 1].toLowerCase();
    var smallestElementSizeSpecifier = data[data.length - 1][
      data[data.length - 1].length - 1
    ].toLowerCase();

    var firstElementSizeSpecifierIndex = sizeMultipliers.findIndex(
      (sizeMultiplier) => {
        return sizeMultiplier.name === smallestElementSizeSpecifier;
      }
    );

    if (smallestElementSizeSpecifier === biggestElementSizeSpecifier) {
      var regExForDataSizeNonSensitive = new RegExp(
        biggestElementSizeSpecifier,
        "ig"
      );
      var dataAlreadyScaledToTheSameUnit = data.map((currentFileSize: any) =>
        Number(currentFileSize.replace(regExForDataSizeNonSensitive, ""))
      );
      return {
        numbersToBeGraphedSpecifier: smallestElementSizeSpecifier,
        numbersToBeGraphed: dataAlreadyScaledToTheSameUnit.reverse(),
        dataLabels: undefined,
        maxGraphValueYAxis: undefined,
        stepSizeYAxis: undefined,
      };
    } else {
      var dataScaledToTheSameUnit = data.map((currentFileSize: any) => {
        var currentFileSizeSpecifier = currentFileSize[
          currentFileSize.length - 1
        ].toLowerCase();
        var currentFileSizeSpecifierIndex = sizeMultipliers.findIndex(
          (sizeMultiplier) => {
            return sizeMultiplier.name === currentFileSizeSpecifier;
          }
        );
        var specifierMultiplier =
          currentFileSizeSpecifierIndex - firstElementSizeSpecifierIndex;

        var regExForCurrentSizeNonSensitive = new RegExp(
          currentFileSizeSpecifier,
          "ig"
        );
        var currentFileSizeWithoutSizeSpecifier = Number(
          currentFileSize.replace(regExForCurrentSizeNonSensitive, "")
        );
        if (
          specifierMultiplier >
          scaleDifferenceBetweenSmallestAndBiggestFileSizes
        ) {
          scaleDifferenceBetweenSmallestAndBiggestFileSizes = specifierMultiplier;
        }
        return (
          currentFileSizeWithoutSizeSpecifier *
          Math.pow(
            SizePerFilePanel._fileSizeMultiplier,
            specifierMultiplier + 1
          )
        );
      });

      return {
        numbersToBeGraphedSpecifier: smallestElementSizeSpecifier,
        numbersToBeGraphed: dataScaledToTheSameUnit.reverse(),
        dataLabels: undefined,
        maxGraphValueYAxis: undefined,
        stepSizeYAxis: undefined,
      };
    }
  }

  private compileOccurrentInfo(stringToIncludeInApostophe: any): string {
    return `'${stringToIncludeInApostophe}'`;
  }

  private getWebviewContent(
    fileNameAndSizePairs: string[] | undefined,
    config: GraphConfig,
    ChartJSSrc: vscode.Uri
  ) {
    if (fileNameAndSizePairs === undefined) {
      return "";
    }
    const labels = fileNameAndSizePairs.map((fileNameAndSize: any) =>
      this.compileOccurrentInfo(fileNameAndSize.fileName)
    );
    let filesSizesGraphModel: GraphDataModel = this.scaleDataAndRemoveSizeFormatter(
      fileNameAndSizePairs.map(
        (fileNameAndSize: any) => fileNameAndSize.fileSize
      )
    );
    if (filesSizesGraphModel.numbersToBeGraphed === undefined) {
      throw new Error("The values to be displayed were not set");
    }
    filesSizesGraphModel.maxGraphValueYAxis =
      Math.ceil(
        (filesSizesGraphModel.numbersToBeGraphed[
          filesSizesGraphModel.numbersToBeGraphed.length - 1
        ] *
          1.1) /
          SizePerFilePanel.yAxisIntervalsScale
      ) * SizePerFilePanel.yAxisIntervalsScale;
    filesSizesGraphModel.stepSizeYAxis = Math.floor(
      filesSizesGraphModel.maxGraphValueYAxis /
        SizePerFilePanel.yAxisIntervalsScale
    );

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
              <button onclick="showPrevious()">Display smaller files</button>
              <button onclick="showNext()">Display bigger files</button>
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
                    labels: [${labels}],
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
                              return value +  ' ${filesSizesGraphModel.numbersToBeGraphedSpecifier}b'
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
                          return data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index] + ' ${filesSizesGraphModel.numbersToBeGraphedSpecifier}b';
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
                                        text: label,
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
    SizePerFilePanel.currentPanel = undefined;
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
