import * as vscode from "vscode";
import * as path from "path";
import Constants from "../../utils/constants";

export default class SizePerFilePanel {
  public static currentPanel: SizePerFilePanel | undefined;

  private readonly _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];

  public static createOrShow(
    commitsPerFile: any,
    config: any,
    context: vscode.ExtensionContext
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
      ChartJSSrc
    );
  }

  private constructor(
    panel: vscode.WebviewPanel,
    commitsPerFile: any,
    config: any,
    ChartJSSrc: vscode.Uri
  ) {
    this._panel = panel;
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    this._panel = panel;
    const webViewContent = this.getWebviewContent(
      commitsPerFile,
      config,
      ChartJSSrc
    );
    this._panel.webview.html = webViewContent;
  }

  scaleDataAndRemoveSizeFormatter(data: any): [number[], string] {
    var sizeMultipliers = [
      { name: "b", value: 1 },
      { name: "k", value: 1024 },
      { name: "m", value: 1024 },
      { name: "g", value: 1024 },
    ];

    if (data == null || data.length == 0) return [[], ""];
    var firstElementSizeSpecifier = data[0][data[0].length - 1].toLowerCase();
    var lastElementSizeSpecifier = data[data.length - 1][
      data[0].length - 1
    ].toLowerCase();

    var regExForDataSizeNonSensitive = new RegExp(
      lastElementSizeSpecifier,
      "ig"
    );
    if (firstElementSizeSpecifier === lastElementSizeSpecifier) {
      var dataAlreadyScaledToTheSameUnit = data.map((currentFileSize: any) =>
        Number(currentFileSize.replace(regExForDataSizeNonSensitive, ""))
      );
      return [dataAlreadyScaledToTheSameUnit, lastElementSizeSpecifier];
    } else {
      //TODO: handle cases where the returned files have different unit sizes (gb vs kb vb b)
      return [[], ""];
    }
  }

  private compileOccurrentInfo(stringToIncludeInApostophe: any): string {
    return `'${stringToIncludeInApostophe}'`;
  }

  private getWebviewContent(
    fileNameAndSizePairs: any | [],
    config: any,
    ChartJSSrc: vscode.Uri
  ) {
    const labels = fileNameAndSizePairs.map((fileNameAndSize: any) =>
      this.compileOccurrentInfo(fileNameAndSize.fileName)
    );
    let dataToBeVisualized: [
      number[],
      string
    ] = this.scaleDataAndRemoveSizeFormatter(
      fileNameAndSizePairs.map(
        (fileNameAndSize: any) => fileNameAndSize.fileSize
      )
    );

    const bodyStyle =
      config.width > 0 && config.height > 0
        ? `body { 
      width:  ${config.width}px; 
      height: ${config.height}px}; 
      margin-top: s70px; 
      margin-left: 70px;`
        : "";
    return `<!DOCTYPE html>
          <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Signin</title>
            </head>
            <body>
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
                        data: [${dataToBeVisualized[0]}],
                        borderWidth: 2,
                        backgroundColor: ${Constants.colors}
                    }]
                  },
                  options: {
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
        
        
                                    return {
                                        // We add the value to the string
                                        text: label +  ' (${dataToBeVisualized[1]}b)',
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
