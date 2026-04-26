const createPullRequestCommentCapability = {
    key: "create-pull-request-comment",

    async handle(context, config = {}) {
        const pullRequest = context.payload?.pull_request;

        if (!pullRequest) {
            context.log.info("create-pull-request-comment: skipping non-pull-request event");
            return;
        }

        const body = config.body || config.message || "Thanks for opening this pull request.";

        await context.octokit.rest.issues.createComment(
            context.issue({
                body,
            }),
        );

        return { body };
    },
};

module.exports = { createPullRequestCommentCapability };
