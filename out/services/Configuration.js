"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
class Configuration {
    static getCommitChartConfiguration() {
        const commitChartConfig = vscode.workspace.getConfiguration("commitChart");
        return {
            width: commitChartConfig.get("width"),
            height: commitChartConfig.get("height"),
            showLegend: commitChartConfig.get("showLegend"),
            legendPosition: commitChartConfig.get("legendPosition")
        };
    }
}
exports.default = Configuration;
//# sourceMappingURL=Configuration.js.map