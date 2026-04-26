const githubBranchProtectionStatusModule = {
    key: "github-branch-protection-status",
    description: "Checks whether a GitHub branch has protection enabled and whether it is locked.",
    runtimes: ["cli"],
    capabilities: [
        {
            key: "read-branch-protection-policy",
        },
    ],
};

module.exports = { githubBranchProtectionStatusModule };
