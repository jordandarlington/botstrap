const path = require("node:path");

const pullRequestGreetingModulePath = path.resolve(
    __dirname,
    "../lib/modules/pull-request-greeting.js",
);

const createPullRequestCommentCapabilityPath = path.resolve(
    __dirname,
    "../lib/capabilities/create-pull-request-comment.js",
);

describe("runBots", () => {
    beforeEach(() => {
        jest.resetModules();
        jest.clearAllMocks();
    });

    it("returns an empty array when configs is not an array", async () => {
        const { runBots } = require("../lib/utils/bot-runner");

        const result = await runBots({}, null);

        expect(result).toEqual([]);
    });

    it("calls nested module handle and appends each return value", async () => {
        const handle = jest.fn().mockResolvedValue("module-result");

        jest.doMock(pullRequestGreetingModulePath, () => ({
            pullRequestGreetingModule: { handle },
        }));

        const { runBots } = require("../lib/utils/bot-runner");
        const context = {};
        const config = { message: "hello" };

        const result = await runBots(context, [
            { path: "pull-request-greeting", config },
        ]);

        expect(handle).toHaveBeenCalledTimes(1);
        expect(handle).toHaveBeenCalledWith(context, config, undefined);
        expect(result).toEqual(["module-result"]);
    });

    it("calls configured capabilities and appends each return value", async () => {
        const handle = jest.fn().mockResolvedValue("comment-result");

        jest.doMock(pullRequestGreetingModulePath, () => ({
            pullRequestGreetingModule: {
                capabilities: [
                    {
                        key: "create-pull-request-comment",
                        config: {
                            body: "default body",
                        },
                    },
                ],
            },
        }));

        jest.doMock(createPullRequestCommentCapabilityPath, () => ({
            createPullRequestCommentCapability: { handle },
        }));

        const { runBots } = require("../lib/utils/bot-runner");
        const context = {};
        const config = {
            enabled: true,
            capabilities: {
                "create-pull-request-comment": {
                    body: "configured body",
                },
            },
        };

        const result = await runBots(context, [
            { path: "pull-request-greeting", config },
        ], "pull_request.opened");

        expect(handle).toHaveBeenCalledTimes(1);
        expect(handle).toHaveBeenCalledWith(
            context,
            expect.objectContaining({
                body: "configured body",
                enabled: true,
            }),
            "pull_request.opened",
        );
        expect(result).toEqual(["comment-result"]);
    });

    it("skips modules that do not support the requested runtime", async () => {
        const handle = jest.fn().mockResolvedValue("module-result");

        jest.doMock(pullRequestGreetingModulePath, () => ({
            pullRequestGreetingModule: {
                runtimes: ["github"],
                handle,
            },
        }));

        const { runBots } = require("../lib/utils/bot-runner");

        const result = await runBots({}, [
            { path: "pull-request-greeting", config: { enabled: true } },
        ], null, { runtime: "cli" });

        expect(handle).not.toHaveBeenCalled();
        expect(result).toEqual([]);
    });

    it("skips modules that do not expose a handle method or capabilities", async () => {
        const { runBots } = require("../lib/utils/bot-runner");

        const result = await runBots({}, [
            { path: "not-a-module", config: {} },
        ]);

        expect(result).toEqual([]);
    });

    it("continues processing when one module cannot be loaded", async () => {
        const handle = jest.fn().mockResolvedValue("module-result");

        jest.doMock(pullRequestGreetingModulePath, () => ({
            pullRequestGreetingModule: { handle },
        }));

        const { runBots } = require("../lib/utils/bot-runner");

        const result = await runBots({}, [
            { path: "missing-module", config: {} },
            { path: "pull-request-greeting", config: { any: true } },
        ]);

        expect(handle).toHaveBeenCalledTimes(1);
        expect(result).toEqual(["module-result"]);
    });
});
