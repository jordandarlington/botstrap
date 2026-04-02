const riskPredictorModule = {
    key: "risk-predictor",
    events: [
        "pull_request.opened",
        "pull_request.synchronize",
        "pull_request.reopened",
    ],

    async handle(context, config = {}) {
        const minimumSeverity = config.minimumSeverity || "MEDIUM";
        const teamsNotification =
            config.teamsNotification !== undefined
                ? config.teamsNotification
                : false;
        const riskDefinition =
            config.riskDefinition || "No risk definition link provided.";

        const changedFiles = await getChangedFiles(context);

        const riskFactors = analyseRiskFactors(changedFiles);
        const riskLevel = determineRiskLevel(riskFactors.length);
        const shouldTrigger = severityMeetsThreshold(riskLevel, minimumSeverity);

        if (!shouldTrigger) {
            context.log.info(
                {
                    module: "risk-predictor",
                    riskLevel,
                    minimumSeverity,
                },
                "Risk level below configured threshold"
            );
            return;
        }

        const body = buildComment({
            riskLevel,
            minimumSeverity,
            riskFactors,
            riskDefinition,
            teamsNotification,
            changedFiles,
        });

        await context.octokit.issues.createComment(
            context.issue({
                body,
            })
        );
    },
};

async function getChangedFiles(context) {
    const owner = context.payload.repository.owner.login;
    const repo = context.payload.repository.name;
    const pullNumber = context.payload.pull_request.number;

    const response = await context.octokit.pulls.listFiles({
        owner,
        repo,
        pull_number: pullNumber,
        per_page: 100,
    });

    return response.data || [];
}

function analyseRiskFactors(files) {
    const factors = [];

    const hasApexClass = files.some((file) => file.filename.endsWith(".cls"));
    const hasApexTest = files.some((file) =>
        file.filename.toLowerCase().includes("test.cls")
    );
    const hasFlow = files.some((file) => file.filename.endsWith(".flow"));
    const hasValidationRule = files.some((file) =>
        file.filename.endsWith(".rule")
    );
    const isLargeChange = files.length >= 5;

    if (hasApexClass && !hasApexTest) {
        factors.push("Apex classes changed without matching test class updates");
    }

    if (hasFlow) {
        factors.push("Flow metadata changed");
    }

    if (hasValidationRule) {
        factors.push("Validation rules changed");
    }

    if (isLargeChange) {
        factors.push(`Large deployment detected (${files.length} changed files)`);
    }

    return factors;
}

function determineRiskLevel(factorCount) {
    if (factorCount >= 3) return "HIGH";
    if (factorCount >= 1) return "MEDIUM";
    return "LOW";
}

function severityMeetsThreshold(actual, threshold) {
    const order = {
        LOW: 1,
        MEDIUM: 2,
        HIGH: 3,
    };

    return order[actual] >= order[String(threshold).toUpperCase()];
}

function buildComment({
    riskLevel,
    minimumSeverity,
    riskFactors,
    riskDefinition,
    teamsNotification,
    changedFiles,
}) {
    const lines = [
        "## Release Risk Predictor",
        "",
        `**Risk Level:** ${riskLevel}`,
        `**Configured Threshold:** ${String(minimumSeverity).toUpperCase()}`,
        `**Changed Files:** ${changedFiles.length}`,
        "",
    ];

    if (riskFactors.length === 0) {
        lines.push("No significant release risks were detected.");
    } else {
        lines.push("**Risk Factors:**");
        lines.push("");

        riskFactors.forEach((factor, index) => {
            lines.push(`${index + 1}. ${factor}`);
        });
    }

    lines.push("");
    lines.push(`**Teams Notification Enabled:** ${teamsNotification ? "Yes" : "No"}`);
    lines.push(`**Risk Definition:** ${riskDefinition}`);

    if (riskLevel === "HIGH") {
        lines.push("");
        lines.push("**Recommendation:** Manual review recommended before merge.");
    } else if (riskLevel === "MEDIUM") {
        lines.push("");
        lines.push("**Recommendation:** Review carefully before approving.");
    } else {
        lines.push("");
        lines.push("**Recommendation:** Standard review should be sufficient.");
    }

    return lines.join("\n");
}

module.exports = { riskPredictorModule };