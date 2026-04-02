const { resolveConfigs } = require("../lib/utils/config-resolver");
const { getRepoConfig } = require("../lib/utils/get-repo-config");

jest.mock("../lib/utils/get-repo-config", () => ({
    getRepoConfig: jest.fn(),
}));

describe("resolveConfigs", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("throws when botstrap config has no modules array", async () => {
        getRepoConfig.mockResolvedValueOnce({});

        await expect(resolveConfigs({})).rejects.toThrow(
            "Invalid botstrap configuration: 'modules' key is missing",
        );
    });

    it("loads config from repo when .github config exists", async () => {
        const context = { repo: "sample" };
        const botstrapConfig = { modules: ["global-config"] };
        const repoConfig = { minimumSeverity: "LOW", teamsNotification: false };
        getRepoConfig.mockResolvedValueOnce(botstrapConfig).mockResolvedValueOnce(repoConfig);

        const result = await resolveConfigs(context);

        expect(getRepoConfig).toHaveBeenCalledTimes(2);
        expect(getRepoConfig).toHaveBeenNthCalledWith(1, context, ".github/botstrap.yml");
        expect(getRepoConfig).toHaveBeenNthCalledWith(2, context, ".github/global-config.yml");
        expect(result).toEqual([
            {
                path: "global-config",
                config: repoConfig,
            },
        ]);
    });

    it("falls back to default YAML config when repo config is missing", async () => {
        getRepoConfig
            .mockResolvedValueOnce({ modules: ["risk-predictor-config"] })
            .mockResolvedValueOnce(null);

        const result = await resolveConfigs({});

        expect(result).toEqual([
            {
                path: "risk-predictor-config",
                config: {
                    enabled: true,
                    minimumSeverity: "MEDIUM",
                    teamsNotification: true,
                    riskDefinition: "https://confluence.example.com/risk-definition",
                },
            },
        ]);
    });

    it("resolves only subscribed modules in resolver order", async () => {
        getRepoConfig
            .mockResolvedValueOnce({
                modules: ["risk-predictor-config", "global-config"],
            })
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce(null);

        const result = await resolveConfigs({});

        expect(result.map((entry) => entry.path)).toEqual([
            "global-config",
            "risk-predictor-config",
        ]);
        expect(getRepoConfig).toHaveBeenNthCalledWith(1, {}, ".github/botstrap.yml");
        expect(getRepoConfig).toHaveBeenNthCalledWith(
            2,
            {},
            ".github/global-config.yml",
        );
        expect(getRepoConfig).toHaveBeenNthCalledWith(
            3,
            {},
            ".github/risk-predictor-config.yml",
        );
    });
});
