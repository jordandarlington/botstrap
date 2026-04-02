const branchLockerModule = {
    key: "branch-locker",
    events: [
        "pull_request.opened"
    ],

    async handle(context) {
        await context.octokit.issues.createComment(
            context.issue({
                body: "[botstrap] Module called: branch-locker",
            })
        );
        return;
    },
};

module.exports = { branchLockerModule };