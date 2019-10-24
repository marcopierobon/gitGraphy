"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
class default_1 {
    static printLine(message) {
        this.outputChanel.appendLine(message);
    }
    static print(message) {
        this.outputChanel.append(message);
    }
}
default_1.outputChanel = vscode.window.createOutputChannel("Simple GIT Stats");
exports.default = default_1;
//# sourceMappingURL=Output.js.map