const {
    createPullRequestCommentCapability,
} = require("../capabilities/create-pull-request-comment");
const { createIssueCommentCapability } = require("../capabilities/create-issue-comment");

const capabilityRegistry = [
    createPullRequestCommentCapability,
    createIssueCommentCapability,
];

function findCapability(capabilityKey) {
    return capabilityRegistry.find((capability) => capability.key === capabilityKey);
}

module.exports = {
    capabilityRegistry,
    findCapability,
};
