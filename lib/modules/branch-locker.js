const branchLockerModule = {
    key: "branch-locker",
    events: [
        "pull_request.opened",
        "pull_request.reopened"
    ],

    async handle(context) {
        await context.octokit.rest.issues.createComment(
            context.issue({
                body: "[botstrap] Module called: branch-locker",
            })
        );
        return;
    },
};

module.exports = { branchLockerModule };