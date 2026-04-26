const githubApiVersion = "2022-11-28";

const queryBranchProtectionPolicyCapability = {
    key: "query-branch-protection-policy",
    description: "Queries GitHub branch protection policies for one or more repository branches.",
    runtimes: ["github", "cli"],

    async handle(context, config = {}) {
        const owner = config.owner || context.repo?.().owner;
        const repo = config.repo || context.repo?.().repo;
        const branches = getBranches(config, context);

        if (!owner || !repo || branches.length === 0) {
            throw new Error("query-branch-protection-policy requires owner, repo, and at least one branch");
        }

        const results = [];

        for (const branch of branches) {
            const policy = await getBranchProtectionPolicy(context, {
                owner,
                repo,
                branch,
                token: config.token,
            });
            const result = normalizeBranchProtectionPolicy({
                owner,
                repo,
                branch,
                policy,
            });

            context.log.info({
                owner,
                repo,
                branch,
                protected: result.protected,
                locked: result.locked,
            }, "query-branch-protection-policy: branch protection status");

            results.push(result);
        }

        return config.branches ? results : results[0];
    },
};

function getBranches(config, context) {
    if (Array.isArray(config.branches)) {
        return config.branches.filter(Boolean);
    }

    if (config.branches) {
        return [config.branches];
    }

    const branch = config.branch || context.payload?.repository?.default_branch;
    return branch ? [branch] : [];
}

async function getBranchProtectionPolicy(context, params) {
    if (context.octokit?.rest?.repos?.getBranchProtection) {
        try {
            const response = await context.octokit.rest.repos.getBranchProtection({
                owner: params.owner,
                repo: params.repo,
                branch: params.branch,
            });

            return response.data;
        } catch (error) {
            if (error.status === 404) {
                return null;
            }

            throw error;
        }
    }

    return getBranchProtectionPolicyViaFetch(params);
}

async function getBranchProtectionPolicyViaFetch({ owner, repo, branch, token }) {
    const encodedOwner = encodeURIComponent(owner);
    const encodedRepo = encodeURIComponent(repo);
    const encodedBranch = encodeURIComponent(branch);
    const resolvedToken = token || process.env.GITHUB_TOKEN;
    const headers = {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": githubApiVersion,
    };

    if (resolvedToken) {
        headers.Authorization = `Bearer ${resolvedToken}`;
    }

    const response = await fetch(
        `https://api.github.com/repos/${encodedOwner}/${encodedRepo}/branches/${encodedBranch}/protection`,
        {
            headers,
        },
    );

    if (response.status === 404) {
        return null;
    }

    if (!response.ok) {
        const responseText = await response.text();
        throw new Error(`GitHub branch protection query failed with ${response.status}: ${responseText}`);
    }

    return response.json();
}

function normalizeBranchProtectionPolicy({ owner, repo, branch, policy }) {
    return {
        owner,
        repo,
        branch,
        protected: Boolean(policy),
        locked: Boolean(policy?.lock_branch?.enabled),
        policy,
    };
}

module.exports = {
    queryBranchProtectionPolicyCapability,
    getBranches,
    normalizeBranchProtectionPolicy,
};
