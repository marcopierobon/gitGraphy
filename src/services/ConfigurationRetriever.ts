import * as vscode from "vscode";

export default class ConfigurationRetriever {
  static getCommitChartConfiguration() : GraphConfig {
    const commitChartConfig = vscode.workspace.getConfiguration("commitChart");
    var graphConfig : GraphConfig = {  
      width: commitChartConfig.get("width"),
      height: commitChartConfig.get("height"),
      showLegend: commitChartConfig.get("showLegend"),
      legendPosition: commitChartConfig.get("legendPosition")
    };
    return graphConfig;
  }
}
