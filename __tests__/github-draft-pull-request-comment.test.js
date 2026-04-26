const {
    githubDraftPullRequestCommentModule,
} = require("../lib/modules/github-draft-pull-request-comment");

describe("githubDraftPullRequestCommentModule", () => {
    function createContext(draft) {
        const createComment = jest.fn().mockResolvedValue({
            data: { id: 123 },
        });
        const issue = jest.fn().mockReturnValue({
            owner: "interactive-investor",
            repo: "botstrap",
            issue_number: 42,
            body: "draft comment",
        });

        return {
            context: {
                payload: {
                    repository: {
                        name: "botstrap",
                        owner: {
                            login: "interactive-investor",
                        },
                    },
                    pull_request: {
                        number: 42,
                        title: "Draft change",
                        draft,
                        state: "open",
                        html_url: "https://github.com/interactive-investor/botstrap/pull/42",
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
            },
            createComment,
            issue,
        };
    }

    it("comments when the pull request is a draft", async () => {
        const { context, createComment, issue } = createContext(true);

        const result = await githubDraftPullRequestCommentModule.handle(context, {
            capabilities: {
                "create-pull-request-comment": {
                    body: "draft comment",
                },
            },
        });

        expect(issue).toHaveBeenCalledWith({
            body: "draft comment",
        });
        expect(createComment).toHaveBeenCalledTimes(1);
        expect(result.commented).toBe(true);
        expect(result.pullRequest.draft).toBe(true);
    });

    it("does not comment when the pull request is not a draft", async () => {
        const { context, createComment } = createContext(false);

        const result = await githubDraftPullRequestCommentModule.handle(context, {});

        expect(createComment).not.toHaveBeenCalled();
        expect(result.commented).toBe(false);
        expect(result.pullRequest.draft).toBe(false);
    });
});
