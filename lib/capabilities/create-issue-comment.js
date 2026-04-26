const createIssueCommentCapability = {
    key: "create-issue-comment",
    description: "Creates a comment on a GitHub issue.",
    runtimes: ["github"],

    async handle(context, config = {}) {
        const issue = context.payload?.issue;

        if (!issue || issue.pull_request) {
            context.log.info("create-issue-comment: skipping non-issue event");
            return;
        }

        const body = config.body || config.message || "Thanks for opening this issue.";

        await context.octokit.rest.issues.createComment(
            context.issue({
                body,
            }),
        );

        return { body };
    },
};

module.exports = { createIssueCommentCapability };
