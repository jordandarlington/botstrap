const { readPullRequestCapability } = require("../capabilities/read-pull-request");
const {
    createPullRequestCommentCapability,
} = require("../capabilities/create-pull-request-comment");

const githubDraftPullRequestCommentModule = {
    key: "github-draft-pull-request-comment",
    description: "Comments on newly opened draft pull requests.",
    runtimes: ["github"],
    events: [
        "pull_request.opened",
        "pull_request.reopened",
        "pull_request.converted_to_draft",
    ],

    async handle(context, config = {}) {
        const pullRequestConfig = config.capabilities?.["read-pull-request"] || {};
        const commentConfig = {
            body: "Thanks for opening this draft pull request. We'll wait until it is ready for review.",
            ...config.capabilities?.["create-pull-request-comment"],
        };
        const pullRequest = await readPullRequestCapability.handle(context, {
            ...config,
            ...pullRequestConfig,
        });

        if (!pullRequest.draft) {
            context.log.info({
                pullNumber: pullRequest.number,
            }, "github-draft-pull-request-comment: skipping non-draft pull request");

            return {
                commented: false,
                pullRequest,
            };
        }

        const comment = await createPullRequestCommentCapability.handle(context, commentConfig);

        return {
            commented: true,
            comment,
            pullRequest,
        };
    },
};

module.exports = { githubDraftPullRequestCommentModule };
