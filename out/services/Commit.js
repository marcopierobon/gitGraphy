"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const { exec } = require("child_process");
// const authorEmail = '%ae';
// const date = '%aI';
// const body = '%b';
// const format = {date, body, email: authorEmail};
// const cmd = `git -C ${dir} log --pretty=format:'${JSON.stringify(format)},'`;
class Commits {
    static getAllPerAuthor(dir) {
        const cmd = `git -C ${dir} shortlog -sn -e --all`;
        return new Promise((resolve, reject) => {
            exec(cmd, { maxBuffer: 1024 * 50 * 1000 }, (err, stdout, stderr) => {
                if (err) {
                    return reject(err);
                }
                if (stderr) {
                    return reject(stderr);
                }
                const lines = stdout.split(/\n/g).slice(0, -1);
                var repoTotalCommits = 0;
                lines.map((line) => {
                    const data = line.split('\t');
                    if (data != null)
                        repoTotalCommits += parseInt(data[0].trim());
                });
                const commitsPerAuthors = lines.map((line) => {
                    const data = line.split('\t');
                    return {
                        totalCommits: data[0].trim(),
                        author: data[1].trim(),
                        percentageOfAllCommits: (data[0].trim() / repoTotalCommits * 100).toFixed(2)
                    };
                });
                return resolve(commitsPerAuthors);
            });
        });
    }
}
exports.default = Commits;
//# sourceMappingURL=Commit.js.map