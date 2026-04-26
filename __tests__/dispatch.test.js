describe("dispatchEvent", () => {
    beforeEach(() => {
        jest.resetModules();
        jest.clearAllMocks();
    });

    it("calls enabled modules that support the incoming event", async () => {
        const runBots = jest.fn().mockResolvedValue([]);
        const getRepoConfig = jest.fn().mockResolvedValue({
            global: { severity: "high" },
            modules: {
                "github-pull-request-initial-comment": { enabled: true, message: "hello" },
            },
        });
        const getModules = jest.fn().mockResolvedValue([
            { "github-pull-request-initial-comment": { enabled: true, message: "hello" } },
        ]);

        jest.doMock("../lib/utils/get-repo-config", () => ({
            getRepoConfig,
        }));

        jest.doMock("../lib/core/registry", () => ({
            getModules,
        }));

        jest.doMock("../lib/utils/bot-runner", () => ({
            runBots,
        }));

        const { dispatchEvent } = require("../lib/core/dispatch");
        const context = {
            log: {
                info: jest.fn(),
                error: jest.fn(),
            },
        };

        await dispatchEvent("pull_request.opened", context);

        expect(runBots).toHaveBeenCalledTimes(1);
        expect(runBots).toHaveBeenCalledWith(
            context,
            [
                {
                    path: "github-pull-request-initial-comment",
                    config: {
                        enabled: true,
                        message: "hello",
                    },
                },
            ],
            "pull_request.opened",
            { runtime: "github" },
        );
    });
});
