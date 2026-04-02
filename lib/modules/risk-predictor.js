const riskPredictorModule = {
    key: "risk-predictor",
    events: ["pull_request.opened"],

    async handle(context, config) {
        const message =
            config.message ||
            "This is a risk comment 🔥";

        await context.octokit.issues.createComment(
            context.issue({
                body: message,
            })
        );
    },
};

module.exports = { riskPredictorModule };