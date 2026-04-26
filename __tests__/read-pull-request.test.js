const {
    normalizePullRequest,
    readPullRequestCapability,
} = require("../lib/capabilities/read-pull-request");

describe("readPullRequestCapability", () => {
    afterEach(() => {
        delete global.fetch;
        delete process.env.GITHUB_TOKEN;
    });

    it("reads pull request details from the payload when present", async () => {
        const context = {
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
                    draft: true,
                    state: "open",
                    html_url: "https://github.com/interactive-investor/botstrap/pull/42",
                },
            },
            log: {
                info: jest.fn(),
            },
        };

        const result = await readPullRequestCapability.handle(context);

        expect(result).toEqual(expect.objectContaining({
            owner: "interactive-investor",
            repo: "botstrap",
            number: 42,
            title: "Draft change",
            draft: true,
            state: "open",
            url: "https://github.com/interactive-investor/botstrap/pull/42",
        }));
    });

    it("reads pull request details through octokit", async () => {
        const get = jest.fn().mockResolvedValue({
            data: {
                number: 7,
                title: "Ready change",
                draft: false,
                state: "open",
                html_url: "https://github.com/interactive-investor/botstrap/pull/7",
            },
        });
        const context = {
            octokit: {
                rest: {
                    pulls: {
                        get,
                    },
                },
            },
            log: {
                info: jest.fn(),
            },
        };

        const result = await readPullRequestCapability.handle(context, {
            owner: "interactive-investor",
            repo: "botstrap",
            pullNumber: 7,
        });

        expect(get).toHaveBeenCalledWith({
            owner: "interactive-investor",
            repo: "botstrap",
            pull_number: 7,
        });
        expect(result.draft).toBe(false);
    });

    it("reads pull request details through fetch for cli contexts", async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: jest.fn().mockResolvedValue({
                number: 9,
                title: "CLI change",
                draft: true,
                state: "open",
                html_url: "https://github.com/interactive-investor/botstrap/pull/9",
            }),
        });

        const context = {
            log: {
                info: jest.fn(),
            },
        };

        const result = await readPullRequestCapability.handle(context, {
            owner: "interactive-investor",
            repo: "botstrap",
            pullNumber: 9,
            token: "secret",
        });

        expect(global.fetch).toHaveBeenCalledWith(
            "https://api.github.com/repos/interactive-investor/botstrap/pulls/9",
            expect.objectContaining({
                headers: expect.objectContaining({
                    Authorization: "Bearer secret",
                }),
            }),
        );
        expect(result.draft).toBe(true);
    });

    it("normalizes pull request data", () => {
        expect(normalizePullRequest({
            owner: "interactive-investor",
            repo: "botstrap",
            pullRequest: {
                number: 1,
                title: "Hello",
                draft: false,
                state: "open",
                html_url: "https://example.test/pr/1",
            },
        })).toEqual(expect.objectContaining({
            owner: "interactive-investor",
            repo: "botstrap",
            number: 1,
            title: "Hello",
            draft: false,
            state: "open",
            url: "https://example.test/pr/1",
        }));
    });
});
