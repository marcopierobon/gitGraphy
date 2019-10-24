"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const CommitsPanel_1 = require("../views/commits-panel/CommitsPanel");
const Commit_1 = require("../services/Commit");
const Configuration_1 = require("../services/Configuration");
const Output_1 = require("../services/Output");
const utils_1 = require("../utils");
class default_1 {
    constructor(context) {
        this.context = context;
    }
    showCommitsPanel() {
        return __awaiter(this, void 0, void 0, function* () {
            if (utils_1.isBlank(vscode.workspace.rootPath)) {
                vscode.window.showInformationMessage('Please open a workspace');
                return;
            }
            const config = Configuration_1.default.getCommitChartConfiguration();
            try {
                const comitsPerAuthor = yield Commit_1.default.getAllPerAuthor(vscode.workspace.rootPath || "");
                CommitsPanel_1.default.createOrShow(comitsPerAuthor, config, this.context);
            }
            catch (error) {
                Output_1.default.printLine(error);
            }
        });
    }
}
exports.default = default_1;
//# sourceMappingURL=mainController.js.map