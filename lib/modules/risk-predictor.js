const riskPredictorModule = {
    key: "risk-predictor",
    events: [
        "pull_request.opened",
        "pull_request.reopened",
    ],

    async handle(context) {
        const files = await getChangedFiles(context);

        const results = files.map((file) => {
            const risk = getRiskForFile(file.filename);
            return {
                file: file.filename,
                risk,
            };
        });

        const overallRisk = getOverallRisk(results);

        const body = buildComment(results, overallRisk);

        await context.octokit.rest.issues.createComment(
            context.issue({
                body,
            })
        );
    },
};

//get the changed files in the pr
async function getChangedFiles(context) {
    const owner = context.payload.repository.owner.login;
    const repo = context.payload.repository.name;
    const pullNumber = context.payload.pull_request.number;

    const response = await context.octokit.rest.pulls.listFiles({
        owner,
        repo,
        pull_number: pullNumber,
    });

    return response.data || [];
}

//the rules
function getRiskForFile(filename) {
    const lower = filename.toLowerCase();

    if (lower.includes("/test/") || lower.includes("/test")) {
        return "LOW";
    }

    if (lower.endsWith(".py") || lower.endsWith("package.json")) {
        return "HIGH";
    }

    if (lower.endsWith(".ts")) {
        return "MEDIUM";
    }

    return "LOW";
}

//detirmine the risks
function getOverallRisk(results) {
    if (results.some((r) => r.risk === "HIGH")) return "HIGH";
    if (results.some((r) => r.risk === "MEDIUM")) return "MEDIUM";
    return "LOW";
}

//build the pr comment
function buildComment(results, overallRisk) {
    const lines = [
        "## 🚨 Release Risk Predictor",
        "",
        `**Overall Risk:** ${overallRisk}`,
        "",
        "**File Breakdown:**",
        "",
    ];

    results.forEach((r, i) => {
        lines.push(`${i + 1}. ${r.file} → ${r.risk}`);
    });

    return lines.join("\n");
}

module.exports = { riskPredictorModule };