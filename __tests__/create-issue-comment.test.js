const {
    createIssueCommentCapability,
} = require("../lib/capabilities/create-issue-comment");

describe("createIssueCommentCapability", () => {
    it("posts an issue comment through the issues API", async () => {
        const createComment = jest.fn().mockResolvedValue({
            data: { id: 123 },
        });
        const issue = jest.fn().mockReturnValue({
            owner: "interactive-investor",
            repo: "botstrap",
            issue_number: 24,
            body: "hello from issue greeting",
        });

        const context = {
            payload: {
                issue: {
                    number: 24,
                },
            },
            octokit: {
                rest: {
                    issues: {
                        createComment,
                    },
                },
            },
            issue,
            log: {
                info: jest.fn(),
            },
        };

        const result = await createIssueCommentCapability.handle(context, {
            body: "hello from issue greeting",
        });

        expect(issue).toHaveBeenCalledWith({
            body: "hello from issue greeting",
        });
        expect(createComment).toHaveBeenCalledWith({
            owner: "interactive-investor",
            repo: "botstrap",
            issue_number: 24,
            body: "hello from issue greeting",
        });
        expect(result).toEqual({ body: "hello from issue greeting" });
    });

    it("skips pull requests represented through issue payloads", async () => {
        const context = {
            payload: {
                issue: {
                    pull_request: {},
                },
            },
            octokit: {
                rest: {
                    issues: {
                        createComment: jest.fn(),
                    },
                },
            },
            log: {
                info: jest.fn(),
            },
        };

        await createIssueCommentCapability.handle(context);

        expect(context.octokit.rest.issues.createComment).not.toHaveBeenCalled();
    });
});
