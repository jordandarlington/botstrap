const teamsNotifierModule = {
    key: "teams-notifier",
    events: ["pull_request.opened"],

    async handle(context, config = {}) {
        const message =
            config.message || "A new pull request has been opened.";

        await context.octokit.issues.createComment(
            context.issue({
                body: message,
            })
        );
    },
};

module.exports = { teamsNotifierModule };