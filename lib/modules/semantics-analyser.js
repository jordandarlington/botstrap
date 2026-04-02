const semanticsAnalyserModule = {
    key: "semantics-analyser",
    events: [
        "pull_request.opened",
        "pull_request.reopened"
    ],

    async handle(context) {
        await context.octokit.issues.createComment(
            context.issue({
                body: "[botstrap] Module called: semantics-analyser",
            })
        );
        return;
    },
};

module.exports = { semanticsAnalyserModule };