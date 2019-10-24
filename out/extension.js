"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const mainController_1 = require("./controllers/mainController");
function activate(context) {
    const controller = new mainController_1.default(context);
    let disposable = vscode.commands.registerCommand("GitStats.viewCommits", () => {
        controller.showCommitsPanel();
    });
    context.subscriptions.push(disposable);
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map