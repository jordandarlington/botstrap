const teamsNotifierModule = {
    key: "teams-notifier",
    events: ["pull_request.opened", "pull_request.reopened"],

    async handle(context, config = {}) {
        const webhookUrl = config.webhookUrl || process.env.TEAMS_WEBHOOK_URL;

        if (!webhookUrl) {
            throw new Error("teams-notifier requires a webhookUrl");
        }

        const pullRequest = context.payload.pull_request;
        const repository = context.payload.repository;
        const sender = context.payload.sender;
        const action = context.payload.action;
        const title =
            config.title || `Pull request ${action}: ${pullRequest.title}`;
        const text =
            config.message ||
            [
                `${sender.login} ${action} PR #${pullRequest.number} in ${repository.full_name}.`,
                "",
                `PR title: ${pullRequest.title}`,
                `PR URL: ${pullRequest.html_url}`,
            ].join("\n");

        const payload = {
            "@type": "MessageCard",
            "@context": "https://schema.org/extensions",
            summary: title,
            themeColor: config.themeColor || "0078D7",
            title,
            text,
            sections: [
                {
                    facts: [
                        { name: "Repository", value: repository.full_name },
                        { name: "Pull Request", value: `#${pullRequest.number}` },
                        { name: "Author", value: sender.login },
                        { name: "Action", value: action },
                    ],
                    markdown: true,
                },
            ],
            potentialAction: [
                {
                    "@type": "OpenUri",
                    name: "Open pull request",
                    targets: [
                        {
                            os: "default",
                            uri: pullRequest.html_url,
                        },
                    ],
                },
            ],
        };

        context.log.info(
            { webhookUrlConfigured: true, title, repository: repository.full_name },
            "teams-notifier: posting webhook",
        );

        const response = await fetch(webhookUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const responseText = await response.text();
            throw new Error(
                `Teams webhook failed with ${response.status}: ${responseText}`,
            );
        }

        context.log.info(
            { status: response.status, repository: repository.full_name },
            "teams-notifier: webhook delivered",
        );
    },
};

module.exports = { teamsNotifierModule };
