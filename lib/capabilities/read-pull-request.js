const githubApiVersion = "2022-11-28";

const readPullRequestCapability = {
    key: "read-pull-request",
    description: "Reads GitHub pull request details.",
    runtimes: ["github", "cli"],

    async handle(context, config = {}) {
        const payloadPullRequest = context.payload?.pull_request;
        const owner = config.owner || context.repo?.().owner || context.payload?.repository?.owner?.login;
        const repo = config.repo || context.repo?.().repo || context.payload?.repository?.name;
        const pullNumber = config.pullNumber || config.number || payloadPullRequest?.number;

        if (!owner || !repo || !pullNumber) {
            throw new Error("read-pull-request requires owner, repo, and pullNumber");
        }

        const pullRequest = payloadPullRequest || await getPullRequest(context, {
            owner,
            repo,
            pullNumber,
            token: config.token,
        });
        const result = normalizePullRequest({
            owner,
            repo,
            pullRequest,
        });

        context.log.info({
            owner,
            repo,
            pullNumber: result.number,
            draft: result.draft,
        }, "read-pull-request: pull request details");

        return result;
    },
};

async function getPullRequest(context, params) {
    if (context.octokit?.rest?.pulls?.get) {
        const response = await context.octokit.rest.pulls.get({
            owner: params.owner,
            repo: params.repo,
            pull_number: params.pullNumber,
        });

        return response.data;
    }

    return getPullRequestViaFetch(params);
}

async function getPullRequestViaFetch({ owner, repo, pullNumber, token }) {
    const encodedOwner = encodeURIComponent(owner);
    const encodedRepo = encodeURIComponent(repo);
    const resolvedToken = token || process.env.GITHUB_TOKEN;
    const headers = {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": githubApiVersion,
    };

    if (resolvedToken) {
        headers.Authorization = `Bearer ${resolvedToken}`;
    }

    const response = await fetch(
        `https://api.github.com/repos/${encodedOwner}/${encodedRepo}/pulls/${pullNumber}`,
        {
            headers,
        },
    );

    if (!response.ok) {
        const responseText = await response.text();
        throw new Error(`GitHub pull request read failed with ${response.status}: ${responseText}`);
    }

    return response.json();
}

function normalizePullRequest({ owner, repo, pullRequest }) {
    return {
        owner,
        repo,
        number: pullRequest.number,
        title: pullRequest.title,
        draft: Boolean(pullRequest.draft),
        state: pullRequest.state,
        url: pullRequest.html_url,
        raw: pullRequest,
    };
}

module.exports = {
    readPullRequestCapability,
    normalizePullRequest,
};
