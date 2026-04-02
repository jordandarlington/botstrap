const { resolveConfigs } = require("../lib/utils/config-resolver");
const { getRepoConfig } = require("../lib/utils/get-repo-config");

jest.mock("../lib/utils/get-repo-config", () => ({
    getRepoConfig: jest.fn(),
}));

describe("resolveConfigs", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("returns an empty list when no modules are subscribed", async () => {
        const result = await resolveConfigs({}, undefined);

        expect(result).toEqual([]);
        expect(getRepoConfig).not.toHaveBeenCalled();
    });

    it("loads config from repo when .github config exists", async () => {
        const context = { repo: "sample" };
        const repoConfig = { minimumSeverity: "LOW", teamsNotification: false };
        getRepoConfig.mockResolvedValue(repoConfig);

        const result = await resolveConfigs(context, ["global-config"]);

        expect(getRepoConfig).toHaveBeenCalledTimes(1);
        expect(getRepoConfig).toHaveBeenCalledWith(context, ".github/global-config.yml");
        expect(result).toEqual([
            {
                path: "global-config",
                config: repoConfig,
            },
        ]);
    });

    it("falls back to default YAML config when repo config is missing", async () => {
        getRepoConfig.mockResolvedValue(null);

        const result = await resolveConfigs({}, ["risk-predictor-config"]);

        expect(result).toEqual([
            {
                path: "risk-predictor-config",
                config: {
                    minimumSeverity: "MEDIUM",
                    teamsNotification: true,
                    riskDefinition: "https://confluence.example.com/risk-definition",
                },
            },
        ]);
    });

    it("resolves only subscribed modules in resolver order", async () => {
        getRepoConfig.mockResolvedValue(null);

        const result = await resolveConfigs({}, [
            "risk-predictor-config",
            "global-config",
        ]);

        expect(result.map((entry) => entry.path)).toEqual([
            "global-config",
            "risk-predictor-config",
        ]);
        expect(getRepoConfig).toHaveBeenNthCalledWith(1, {}, ".github/global-config.yml");
        expect(getRepoConfig).toHaveBeenNthCalledWith(
            2,
            {},
            ".github/risk-predictor-config.yml",
        );
    });
});
