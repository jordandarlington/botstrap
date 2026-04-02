const riskPredictorModule = {
    key: "risk-predictor",
    events: [
        "pull_request.opened",
        "pull_request.reopened"
    ],

    async handle(context) {
        await context.octokit.rest.issues.createComment(
            context.issue({
                body: "[botstrap] Module called: risk-predictor",
            })
        );
        return;
    },
};

module.exports = { riskPredictorModule };