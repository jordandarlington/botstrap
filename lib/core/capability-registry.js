const {
    createPullRequestCommentCapability,
} = require("../capabilities/create-pull-request-comment");
const { createIssueCommentCapability } = require("../capabilities/create-issue-comment");
const {
    readBranchProtectionPolicyCapability,
} = require("../capabilities/read-branch-protection-policy");
const { readPullRequestCapability } = require("../capabilities/read-pull-request");

const capabilityRegistry = [
    createPullRequestCommentCapability,
    createIssueCommentCapability,
    readBranchProtectionPolicyCapability,
    readPullRequestCapability,
];

function findCapability(capabilityKey) {
    return capabilityRegistry.find((capability) => capability.key === capabilityKey);
}

module.exports = {
    capabilityRegistry,
    findCapability,
};
