const path = require("node:path");

const githubPullRequestInitialCommentModulePath = path.resolve(
    __dirname,
    "../lib/modules/github-pull-request-initial-comment.js",
);

const createPullRequestCommentCapabilityPath = path.resolve(
    __dirname,
    "../lib/capabilities/create-pull-request-comment.js",
);

const githubBranchProtectionStatusModulePath = path.resolve(
    __dirname,
    "../lib/modules/github-branch-protection-status.js",
);

const readBranchProtectionPolicyCapabilityPath = path.resolve(
    __dirname,
    "../lib/capabilities/read-branch-protection-policy.js",
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

        jest.doMock(githubPullRequestInitialCommentModulePath, () => ({
            githubPullRequestInitialCommentModule: { handle },
        }));

        const { runBots } = require("../lib/utils/bot-runner");
        const context = {};
        const config = { message: "hello" };

        const result = await runBots(context, [
            { path: "github-pull-request-initial-comment", config },
        ]);

        expect(handle).toHaveBeenCalledTimes(1);
        expect(handle).toHaveBeenCalledWith(context, config, undefined);
        expect(result).toEqual(["module-result"]);
    });

    it("calls configured capabilities and appends each return value", async () => {
        const handle = jest.fn().mockResolvedValue("comment-result");

        jest.doMock(githubPullRequestInitialCommentModulePath, () => ({
            githubPullRequestInitialCommentModule: {
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
            { path: "github-pull-request-initial-comment", config },
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

        jest.doMock(githubPullRequestInitialCommentModulePath, () => ({
            githubPullRequestInitialCommentModule: {
                runtimes: ["github"],
                handle,
            },
        }));

        const { runBots } = require("../lib/utils/bot-runner");

        const result = await runBots({}, [
            { path: "github-pull-request-initial-comment", config: { enabled: true } },
        ], null, { runtime: "cli" });

        expect(handle).not.toHaveBeenCalled();
        expect(result).toEqual([]);
    });

    it("lets cli runtime overrides win over capability config", async () => {
        const handle = jest.fn().mockResolvedValue("status-result");

        jest.doMock(githubBranchProtectionStatusModulePath, () => ({
            githubBranchProtectionStatusModule: {
                runtimes: ["cli"],
                capabilities: [
                    {
                        key: "read-branch-protection-policy",
                        config: {
                            branch: "main",
                        },
                    },
                ],
            },
        }));

        jest.doMock(readBranchProtectionPolicyCapabilityPath, () => ({
            readBranchProtectionPolicyCapability: {
                runtimes: ["cli"],
                handle,
            },
        }));

        const { runBots } = require("../lib/utils/bot-runner");

        const result = await runBots({}, [
            {
                path: "github-branch-protection-status",
                config: {
                    enabled: true,
                    capabilities: {
                        "read-branch-protection-policy": {
                            branches: ["develop"],
                        },
                    },
                    runtimeOverrides: {
                        branches: ["release", "hotfix"],
                    },
                },
            },
        ], null, { runtime: "cli" });

        expect(handle).toHaveBeenCalledWith(
            {},
            expect.objectContaining({
                branches: ["release", "hotfix"],
            }),
            null,
        );
        expect(result).toEqual(["status-result"]);
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

        jest.doMock(githubPullRequestInitialCommentModulePath, () => ({
            githubPullRequestInitialCommentModule: { handle },
        }));

        const { runBots } = require("../lib/utils/bot-runner");

        const result = await runBots({}, [
            { path: "missing-module", config: {} },
            { path: "github-pull-request-initial-comment", config: { any: true } },
        ]);

        expect(handle).toHaveBeenCalledTimes(1);
        expect(result).toEqual(["module-result"]);
    });
});
