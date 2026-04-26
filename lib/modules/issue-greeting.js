const issueGreetingModule = {
    key: "issue-greeting",
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

module.exports = { issueGreetingModule };
