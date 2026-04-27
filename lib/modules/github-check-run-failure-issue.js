const {
    createPullRequestCommentCapability,
} = require("../capabilities/create-pull-request-comment");
const { createIssueCapability } = require("../capabilities/create-issue");

const githubCheckRunFailureIssueModule = {
    key: "github-check-run-failure-issue",
    description: "Comments on pull requests when a configured check run fails and creates a follow-up issue.",
    runtimes: ["github"],
    events: [
        "check_run.completed",
    ],

    async handle(context, config = {}) {
        const checkRun = context.payload?.check_run;

        if (!checkRun || checkRun.conclusion !== "failure") {
            context.log.info("github-check-run-failure-issue: skipping non-failed check run");
            return { commented: false, issueCreated: false };
        }

        if (!matchesConfiguredCheckRun(checkRun, config)) {
            context.log.info({
                checkRunName: checkRun.name,
            }, "github-check-run-failure-issue: skipping unconfigured check run");
            return { commented: false, issueCreated: false, checkRun };
        }

        const pullRequest = checkRun.pull_requests?.[0];

        if (!pullRequest) {
            context.log.info({
                checkRunName: checkRun.name,
            }, "github-check-run-failure-issue: skipping check run without pull request");
            return { commented: false, issueCreated: false, checkRun };
        }

        const pullRequestContext = buildPullRequestContext(context, pullRequest);
        const commentConfig = {
            body: getDefaultCommentBody(checkRun, pullRequest),
            ...config.capabilities?.["create-pull-request-comment"],
        };
        const issueConfig = {
            title: getDefaultIssueTitle(checkRun, pullRequest),
            body: getDefaultIssueBody(checkRun, pullRequest, context),
            ...config.capabilities?.["create-issue"],
        };

        const comment = await createPullRequestCommentCapability.handle(
            pullRequestContext,
            commentConfig,
        );
        const issue = await createIssueCapability.handle(context, issueConfig);

        return {
            commented: true,
            issueCreated: true,
            comment,
            issue,
            checkRun,
            pullRequest,
        };
    },
};

function matchesConfiguredCheckRun(checkRun, config = {}) {
    const configuredNames = [
        ...normalizeNames(config.checkRunName),
        ...normalizeNames(config.runName),
        ...normalizeNames(config.name),
        ...normalizeNames(config.checkRunNames),
    ];

    if (configuredNames.length === 0) {
        return true;
    }

    return configuredNames.includes(checkRun.name);
}

function normalizeNames(value) {
    if (!value) {
        return [];
    }

    return Array.isArray(value) ? value.filter(Boolean) : [value];
}

function buildPullRequestContext(context, pullRequest) {
    return {
        ...context,
        payload: {
            ...context.payload,
            pull_request: pullRequest,
        },
        issue(params = {}) {
            return context.repo({
                ...params,
                issue_number: pullRequest.number,
            });
        },
    };
}

function getDefaultCommentBody(checkRun, pullRequest) {
    const detailsUrl = checkRun.details_url
        ? `\n\nDetails: ${checkRun.details_url}`
        : "";

    return `The '${checkRun.name}' check run failed for this pull request. A follow-up issue will be created to track the fix.${detailsUrl}`;
}

function getDefaultIssueTitle(checkRun, pullRequest) {
    return `Fix failing ${checkRun.name} check for PR #${pullRequest.number}`;
}

function getDefaultIssueBody(checkRun, pullRequest, context) {
    const lines = [
        `The '${checkRun.name}' check run failed for pull request #${pullRequest.number}.`,
    ];

    if (pullRequest.html_url) {
        lines.push("", `Pull request: ${pullRequest.html_url}`);
    }

    if (checkRun.html_url || checkRun.details_url) {
        lines.push(`Check run: ${checkRun.html_url || checkRun.details_url}`);
    }

    if (context.payload?.repository?.full_name) {
        lines.push(`Repository: ${context.payload.repository.full_name}`);
    }

    return lines.join("\n");
}

module.exports = {
    githubCheckRunFailureIssueModule,
    matchesConfiguredCheckRun,
};
