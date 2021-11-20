

# GitGraphy

[![Build Status](https://dev.azure.com/pierobond/GitGraphy/_apis/build/status/marcopierobon.gitGraphy?branchName=master)](https://dev.azure.com/pierobond/GitGraphy/_build/latest?definitionId=2&branchName=master)
[![Marketplace Version](https://vsmarketplacebadge.apphb.com/version-short/marco-pierobon.git-graphy.svg?logo=visual-studio-code&color=pink)](https://marketplace.visualstudio.com/items?itemName=marco-pierobon.git-graphy)

## Description

Visualize statistics of your git repository directly within Visual Studio Code.

## Main Features
- View commits by author as a pie chart (based on [chartjs](https://www.chartjs.org/))
- View number of commits per file as a bar (based on [chartjs](https://www.chartjs.org/))
- Display the biggest files in the repo (based on [chartjs](https://www.chartjs.org/))

## How to use the extension
1. Open the Command Palette via the shortcut specific to your OS:

- on OSX: Press `⇧⌘P` (aka `SHIFT+CMD+P`)
- on Windows: Press `Ctrl+Shift+P` then type 

2. Then type: `GitGraphy:`. At this point you should see the available graphs listed.

3. Finally, select one of the existing commands (listed below)

Command | Description
--- | ---
```GitGraphy: View Commits``` | View Commit Chart by author.
```GitGraphy: View Commits Per File``` | View Commit Chart per file.
```GitGraphy: View Largest files``` | Show the largest files in the repository.
```GitGraphy: View the files with the most contributors``` | Show the files with the most contributors in the repository.

## Output samples

### Git Graphy: View Largest files on the EF core repo

![Big files output](design/bigFiles.gif)

### Git Graphy: View Commits Per File on the EF core repo

![commits per files output](design/commitsPerFile.gif)

### Git Graphy: View the files with the most contributors on the oidc angular repo

![contributors per files output](design/contributorsPerFile.gif)

## License

Started as a copy of simple-git-stats https://github.com/HoangNguyen17193/vscode-simple-git-stats

[MIT License](LICENSE)
