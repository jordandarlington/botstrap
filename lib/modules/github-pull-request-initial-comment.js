const githubPullRequestInitialCommentModule = {
    key: "github-pull-request-initial-comment",
    description: "Posts an initial greeting on newly opened pull requests.",
    runtimes: ["github"],
    events: [
        "pull_request.opened",
    ],
    capabilities: [
        {
            key: "create-pull-request-comment",
            config: {
                body: "Thanks for opening this pull request. We'll take a look shortly.",
            },
        },
    ],
};

module.exports = { githubPullRequestInitialCommentModule };
