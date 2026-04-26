const {
    createPullRequestCommentCapability,
} = require("../capabilities/create-pull-request-comment");
const { createIssueCommentCapability } = require("../capabilities/create-issue-comment");
const {
    queryBranchProtectionPolicyCapability,
} = require("../capabilities/query-branch-protection-policy");

const capabilityRegistry = [
    createPullRequestCommentCapability,
    createIssueCommentCapability,
    queryBranchProtectionPolicyCapability,
];

function findCapability(capabilityKey) {
    return capabilityRegistry.find((capability) => capability.key === capabilityKey);
}

module.exports = {
    capabilityRegistry,
    findCapability,
};
