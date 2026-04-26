const pullRequestGreetingModule = {
    key: "pull-request-greeting",
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

module.exports = { pullRequestGreetingModule };
