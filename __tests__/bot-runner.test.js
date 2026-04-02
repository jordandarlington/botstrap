const path = require("node:path");

const riskPredictorModulePath = path.resolve(
    __dirname,
    "../lib/modules/risk-predictor.js",
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
        const handle = jest.fn().mockResolvedValue("risk-result");

        jest.doMock(riskPredictorModulePath, () => ({
            riskPredictorModule: { handle },
        }));

        const { runBots } = require("../lib/utils/bot-runner");
        const context = {};
        const config = { message: "hello" };

        const result = await runBots(context, [
            { path: "risk-predictor", config },
        ]);

        expect(handle).toHaveBeenCalledTimes(1);
        expect(handle).toHaveBeenCalledWith(context, config);
        expect(result).toEqual(["risk-result"]);
    });

    it("skips modules that do not expose a handle method", async () => {
        const { runBots } = require("../lib/utils/bot-runner");

        const result = await runBots({}, [
            { path: "branch-locker", config: {} },
        ]);

        expect(result).toEqual([]);
    });

    it("continues processing when one module cannot be loaded", async () => {
        const handle = jest.fn().mockResolvedValue("risk-result");

        jest.doMock(riskPredictorModulePath, () => ({
            riskPredictorModule: { handle },
        }));

        const { runBots } = require("../lib/utils/bot-runner");

        const result = await runBots({}, [
            { path: "missing-module", config: {} },
            { path: "risk-predictor", config: { any: true } },
        ]);

        expect(handle).toHaveBeenCalledTimes(1);
        expect(result).toEqual(["risk-result"]);
    });
});
