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
        const botstrapConfig = { modules: ["pull-request-greeting-config"] };
        const repoConfig = { enabled: true, body: "hello from repo config" };
        getRepoConfig.mockResolvedValueOnce(botstrapConfig).mockResolvedValueOnce(repoConfig);

        const result = await resolveConfigs(context);

        expect(getRepoConfig).toHaveBeenCalledTimes(2);
        expect(getRepoConfig).toHaveBeenNthCalledWith(1, context, ".github/botstrap.yml");
        expect(getRepoConfig).toHaveBeenNthCalledWith(2, context, ".github/pull-request-greeting-config.yml");
        expect(result).toEqual([
            {
                path: "pull-request-greeting-config",
                config: repoConfig,
            },
        ]);
    });

    it("falls back to default YAML config when repo config is missing", async () => {
        getRepoConfig
            .mockResolvedValueOnce({ modules: ["issue-greeting-config"] })
            .mockResolvedValueOnce(null);

        const result = await resolveConfigs({});

        expect(result).toEqual([
            {
                path: "issue-greeting-config",
                config: {
                    enabled: true,
                    capabilities: {
                        "create-issue-comment": {
                            body: "Thanks for opening this issue. We'll take a look shortly.",
                        },
                    },
                },
            },
        ]);
    });

    it("resolves only subscribed modules in resolver order", async () => {
        getRepoConfig
            .mockResolvedValueOnce({
                modules: ["unknown-config", "issue-greeting-config", "pull-request-greeting-config"],
            })
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce(null);

        const result = await resolveConfigs({});

        expect(result.map((entry) => entry.path)).toEqual([
            "pull-request-greeting-config",
            "issue-greeting-config",
        ]);
        expect(getRepoConfig).toHaveBeenNthCalledWith(1, {}, ".github/botstrap.yml");
        expect(getRepoConfig).toHaveBeenNthCalledWith(
            2,
            {},
            ".github/pull-request-greeting-config.yml",
        );
        expect(getRepoConfig).toHaveBeenNthCalledWith(
            3,
            {},
            ".github/issue-greeting-config.yml",
        );
    });
});
