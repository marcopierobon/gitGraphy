import * as vscode from 'vscode';
import * as path from 'path';
import Constants from '../../utils/constants';

export default class CommitsPerFilePanel {
  public static currentPanel: CommitsPerFilePanel | undefined;

  private readonly _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];

  public static createOrShow(comitsPerFile: any, config: any, context:vscode.ExtensionContext) {
    const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;
    if (CommitsPerFilePanel.currentPanel) {
      CommitsPerFilePanel.currentPanel._panel.reveal(column);
      return;
    }

    const panel = vscode.window.createWebviewPanel("CommitsPanel", "View Commits Per File", column || vscode.ViewColumn.One,
      {
        enableScripts: true
      }
    );

    const ChartJSFilePath = vscode.Uri.file(
      path.join(context.extensionPath, 'resources', 'Chart.bundle.min.js')
    );

    const ChartJSSrc = ChartJSFilePath.with({ scheme: 'vscode-resource' });
    CommitsPerFilePanel.currentPanel = new CommitsPerFilePanel(panel, comitsPerFile, config, ChartJSSrc);
  }

  private constructor(panel: vscode.WebviewPanel, comitsPerFile:any, config:any, ChartJSSrc: vscode.Uri) {
    this._panel = panel;
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    this._panel = panel;
    const webViewContent = this.getWebviewContent(comitsPerFile, config, ChartJSSrc);
    this._panel.webview.html = webViewContent;
  }

  private compileOccurrentInfo(stringToIncludeInApostophe:any): string{
    return `'${stringToIncludeInApostophe}'`;
  }

  private getWebviewContent(comitsPerFile: any | [], config:any, ChartJSSrc: vscode.Uri) {
    const labels = comitsPerFile.map((commit:any) => this.compileOccurrentInfo(commit.label));
    const data = (comitsPerFile.map((commit:any) => commit.occurrences));
    const bodyStyle = (config.width > 0 && config.height >0) ? `body { width:  ${config.width}px; height: ${config.width}px}` : '';
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
                        label: 'Number of commits',
                        data: [${data}],
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
                      fontColor: 'rgb(255, 99, 132)'
                    }
                  }
                });
              </script>
            </body>
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
      CommitsPerFilePanel.currentPanel = undefined;
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