describe("dispatchEvent", () => {
    beforeEach(() => {
        jest.resetModules();
        jest.clearAllMocks();
    });

    it("calls enabled modules that support the incoming event", async () => {
        const handle = jest.fn().mockResolvedValue(undefined);
        const getRepoConfig = jest.fn().mockResolvedValue({
            global: { severity: "high" },
            modules: {
                "risk-predictor": { enabled: true, message: "hello" },
            },
        });

        jest.doMock("../lib/utils/get-repo-config", () => ({
            getRepoConfig,
        }));

        jest.doMock("../lib/utils/safe-run", () => ({
            safeRun: jest.fn(async (_moduleKey, fn) => fn()),
        }));

        jest.doMock("../lib/core/registry", () => ({
            moduleRegistry: [
                {
                    key: "risk-predictor",
                    events: ["pull_request.opened"],
                    handle,
                },
            ],
        }));

        const { dispatchEvent } = require("../lib/core/dispatch");
        const context = {
            log: {
                info: jest.fn(),
                error: jest.fn(),
            },
        };

        await dispatchEvent("pull_request.opened", context);

        expect(handle).toHaveBeenCalledTimes(1);
        expect(handle).toHaveBeenCalledWith(context, {
            enabled: true,
            severity: "high",
            message: "hello",
        });
    });
});
