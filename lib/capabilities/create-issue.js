const createIssueCapability = {
    key: "create-issue",
    description: "Creates a GitHub issue.",
    runtimes: ["github"],

    async handle(context, config = {}) {
        if (!config.title) {
            throw new Error("create-issue requires title");
        }

        const params = context.repo({
            title: config.title,
            body: config.body || config.message || "",
        });

        if (config.labels) {
            params.labels = config.labels;
        }

        if (config.assignees) {
            params.assignees = config.assignees;
        }

        if (config.milestone) {
            params.milestone = config.milestone;
        }

        const response = await context.octokit.rest.issues.create(params);
        const issue = response.data;

        return {
            number: issue.number,
            url: issue.html_url,
            title: issue.title,
        };
    },
};

module.exports = { createIssueCapability };
