const teamsNotifierModule = {
    key: "teams-notifier",
    events: ["pull_request.opened", "pull_request.reopened"],

    async handle(context, config = {}) {
        const message =
            config.message || "A new pull request has been opened.";

        context.log.info({ message }, "teams-notifier: posting comment");

        const result = await context.octokit.rest.issues.createComment(
            context.issue({
                body: message,
            })
        );

        context.log.info({ commentId: result.data.id }, "teams-notifier: comment created");
    },
};

module.exports = { teamsNotifierModule };