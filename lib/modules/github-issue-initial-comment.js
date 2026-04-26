const githubIssueInitialCommentModule = {
    key: "github-issue-initial-comment",
    description: "Posts an initial greeting on newly opened issues.",
    runtimes: ["github"],
    events: [
        "issues.opened",
    ],
    capabilities: [
        {
            key: "create-issue-comment",
            config: {
                body: "Thanks for opening this issue. We'll take a look shortly.",
            },
        },
    ],
};

module.exports = { githubIssueInitialCommentModule };
