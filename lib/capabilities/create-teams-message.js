const createTeamsMessageCapability = {
    key: "create-teams-message",
    description: "Creates a Microsoft Teams webhook message.",
    runtimes: ["github"],

    async handle(context, config = {}) {
        const webhookUrl = config.webhookUrl || process.env.TEAMS_WEBHOOK_URL;

        if (!webhookUrl) {
            throw new Error("create-teams-message requires webhookUrl or TEAMS_WEBHOOK_URL");
        }

        const payload = buildTeamsPayload(context, config);

        context.log.info({
            title: payload.title,
            webhookUrlConfigured: true,
        }, "create-teams-message: posting webhook");

        const response = await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const responseText = await response.text();
            throw new Error(`Teams webhook failed with ${response.status}: ${responseText}`);
        }

        context.log.info({
            status: response.status,
        }, "create-teams-message: webhook delivered");

        return { payload, status: response.status };
    },
};

function buildTeamsPayload(context, config = {}) {
    const title = config.title || getDefaultTitle(context);
    const text = config.text || config.message || getDefaultText(context);
    const facts = config.facts || getDefaultFacts(context);
    const actions = config.actions || getDefaultActions(context);

    return {
        "@type": "MessageCard",
        "@context": "https://schema.org/extensions",
        summary: config.summary || title,
        themeColor: config.themeColor || "0078D7",
        title,
        text,
        sections: [
            {
                facts,
                markdown: true,
            },
        ],
        potentialAction: actions,
    };
}

function getDefaultTitle(context) {
    const payload = context.payload || {};

    if (payload.pull_request) {
        return `Pull request ${payload.action}: ${payload.pull_request.title}`;
    }

    if (payload.issue) {
        return `Issue ${payload.action}: ${payload.issue.title}`;
    }

    return "Botstrap notification";
}

function getDefaultText(context) {
    const payload = context.payload || {};
    const repository = payload.repository?.full_name || "unknown repository";
    const sender = payload.sender?.login || "Someone";

    if (payload.pull_request) {
        return `${sender} ${payload.action} PR #${payload.pull_request.number} in ${repository}.`;
    }

    if (payload.issue) {
        return `${sender} ${payload.action} issue #${payload.issue.number} in ${repository}.`;
    }

    return `${sender} triggered a Botstrap notification in ${repository}.`;
}

function getDefaultFacts(context) {
    const payload = context.payload || {};
    const facts = [
        { name: "Repository", value: payload.repository?.full_name || "unknown" },
    ];

    if (payload.pull_request) {
        facts.push(
            { name: "Pull Request", value: `#${payload.pull_request.number}` },
            { name: "Author", value: payload.sender?.login || "unknown" },
            { name: "Action", value: payload.action || "unknown" },
        );
    } else if (payload.issue) {
        facts.push(
            { name: "Issue", value: `#${payload.issue.number}` },
            { name: "Author", value: payload.sender?.login || "unknown" },
            { name: "Action", value: payload.action || "unknown" },
        );
    }

    return facts;
}

function getDefaultActions(context) {
    const payload = context.payload || {};
    const url = payload.pull_request?.html_url || payload.issue?.html_url;

    if (!url) {
        return [];
    }

    return [
        {
            "@type": "OpenUri",
            name: payload.pull_request ? "Open pull request" : "Open issue",
            targets: [
                {
                    os: "default",
                    uri: url,
                },
            ],
        },
    ];
}

module.exports = {
    createTeamsMessageCapability,
    buildTeamsPayload,
};
