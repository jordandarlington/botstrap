const {
    createPullRequestCommentCapability,
} = require("../lib/capabilities/create-pull-request-comment");

describe("createPullRequestCommentCapability", () => {
    it("posts a pull request comment through the issues API", async () => {
        const createComment = jest.fn().mockResolvedValue({
            data: { id: 123 },
        });
        const issue = jest.fn().mockReturnValue({
            owner: "interactive-investor",
            repo: "botstrap",
            issue_number: 42,
            body: "hello from pr greeting",
        });

        const context = {
            payload: {
                pull_request: {
                    number: 42,
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

        const result = await createPullRequestCommentCapability.handle(context, {
            body: "hello from pr greeting",
        });

        expect(issue).toHaveBeenCalledWith({
            body: "hello from pr greeting",
        });
        expect(createComment).toHaveBeenCalledWith({
            owner: "interactive-investor",
            repo: "botstrap",
            issue_number: 42,
            body: "hello from pr greeting",
        });
        expect(result).toEqual({ body: "hello from pr greeting" });
    });

    it("skips events without pull request payloads", async () => {
        const context = {
            payload: {},
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

        await createPullRequestCommentCapability.handle(context);

        expect(context.octokit.rest.issues.createComment).not.toHaveBeenCalled();
    });
});
