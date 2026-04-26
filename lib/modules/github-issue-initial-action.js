const githubIssueInitialActionModule = {
    key: "github-issue-initial-action",
    description: "Posts an initial greeting on newly opened issues by posting a comment and Teams message.",
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
        {
            key: "create-teams-message",
            config: {
                title: "New issue opened",
                message: "A new issue was opened. Use the Teams action to view it in GitHub.",
            },
        },
    ],
};

module.exports = { githubIssueInitialActionModule };
