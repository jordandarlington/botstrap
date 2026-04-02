const riskPredictorModule = {
    key: "risk-predictor",
    events: [
        "pull_request.opened",
        "pull_request.reopened"
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

        await syncRiskLabels(context, overallRisk);

        return {
            overallRisk,
            results,
        };
    },
};

// get the changed files in the pr
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

// the rules
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

// determine the risks
function getOverallRisk(results) {
    if (results.some((r) => r.risk === "HIGH")) return "HIGH";
    if (results.some((r) => r.risk === "MEDIUM")) return "MEDIUM";
    return "LOW";
}

// build the pr comment
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

// add/remove labels so only one risk label exists
async function syncRiskLabels(context, overallRisk) {
    const owner = context.payload.repository.owner.login;
    const repo = context.payload.repository.name;
    const issue_number = context.payload.pull_request.number;

    const desiredLabel = getLabelForRisk(overallRisk);
    const riskLabels = ["risk:high", "risk:medium", "risk:low"];

    const existingLabelsResponse = await context.octokit.rest.issues.listLabelsOnIssue({
        owner,
        repo,
        issue_number,
    });

    const existingLabels = existingLabelsResponse.data.map((label) => label.name);

    // remove old risk labels except the one we want
    for (const label of riskLabels) {
        if (label !== desiredLabel && existingLabels.includes(label)) {
            try {
                await context.octokit.rest.issues.removeLabel({
                    owner,
                    repo,
                    issue_number,
                    name: label,
                });
            } catch (error) {
                // ignore if label is already missing
                context.log.info({ label, error }, "Could not remove label");
            }
        }
    }

    // add the desired label if it is not already present
    if (!existingLabels.includes(desiredLabel)) {
        await context.octokit.rest.issues.addLabels({
            owner,
            repo,
            issue_number,
            labels: [desiredLabel],
        });
    }
}

function getLabelForRisk(overallRisk) {
    if (overallRisk === "HIGH") return "risk:high";
    if (overallRisk === "MEDIUM") return "risk:medium";
    return "risk:low";
}

module.exports = { riskPredictorModule };