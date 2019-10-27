import * as vscode from "vscode";

export default class ConfigurationRetriever {
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
