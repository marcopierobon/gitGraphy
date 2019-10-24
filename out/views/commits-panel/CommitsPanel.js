"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const path = require("path");
const constants_1 = require("../../utils/constants");
class CommitsPanel {
    constructor(panel, comitsPerAuthor, config, ChartJSSrc) {
        this._disposables = [];
        this._panel = panel;
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        this._panel = panel;
        const webViewContent = this.getWebviewContent(comitsPerAuthor, config, ChartJSSrc);
        this._panel.webview.html = webViewContent;
    }
    static createOrShow(comitsPerAuthor, config, context) {
        const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;
        if (CommitsPanel.currentPanel) {
            CommitsPanel.currentPanel._panel.reveal(column);
            return;
        }
        const panel = vscode.window.createWebviewPanel("CommitsPanel", "CommitsPerAuthor", column || vscode.ViewColumn.One, {
            enableScripts: true
        });
        const ChartJSFilePath = vscode.Uri.file(path.join(context.extensionPath, 'resources', 'Chart.bundle.min.js'));
        const ChartJSSrc = ChartJSFilePath.with({ scheme: 'vscode-resource' });
        CommitsPanel.currentPanel = new CommitsPanel(panel, comitsPerAuthor, config, ChartJSSrc);
    }
    compileUserCommitsInfo(commit) {
        return `'${commit.author}: ${commit.totalCommits} commits - ${commit.percentageOfAllCommits}%'`;
    }
    getWebviewContent(comitsPerAuthor, config, ChartJSSrc) {
        const labels = comitsPerAuthor.map((commit) => this.compileUserCommitsInfo(commit));
        const data = (comitsPerAuthor.map((commit) => commit.totalCommits).toString());
        const bodyStyle = (config.width > 0 && config.height > 0) ? `body { width:  ${config.width}px; height: ${config.width}px}` : '';
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
                  type: 'pie',
                  data: {
                    labels: [${labels}],
                    datasets: [{
                        data: [${data}],
                        borderWidth: 2,
                        backgroundColor: ${constants_1.default.colors}
                    }]
                  },
                  options: {
                    maintainAspectRatio: true,
                    backgroundColor: '#c1c1c1',
                    responsive: true,
                    legend: {
                      display: ${config.showLegend},
                      position: '${config.legendPosition}',
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
    dispose() {
        CommitsPanel.currentPanel = undefined;
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
exports.default = CommitsPanel;
//# sourceMappingURL=CommitsPanel.js.map