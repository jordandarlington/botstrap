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
        const botstrapConfig = { modules: ["github-pull-request-initial-comment-config"] };
        const repoConfig = { enabled: true, body: "hello from repo config" };
        getRepoConfig.mockResolvedValueOnce(botstrapConfig).mockResolvedValueOnce(repoConfig);

        const result = await resolveConfigs(context);

        expect(getRepoConfig).toHaveBeenCalledTimes(2);
        expect(getRepoConfig).toHaveBeenNthCalledWith(1, context, ".github/botstrap.yml");
        expect(getRepoConfig).toHaveBeenNthCalledWith(2, context, ".github/github-pull-request-initial-comment-config.yml");
        expect(result).toEqual([
            {
                path: "github-pull-request-initial-comment-config",
                config: repoConfig,
            },
        ]);
    });

    it("falls back to default YAML config when repo config is missing", async () => {
        getRepoConfig
            .mockResolvedValueOnce({ modules: ["github-issue-initial-comment-config"] })
            .mockResolvedValueOnce(null);

        const result = await resolveConfigs({});

        expect(result).toEqual([
            {
                path: "github-issue-initial-comment-config",
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
                modules: ["unknown-config", "github-issue-initial-comment-config", "github-pull-request-initial-comment-config"],
            })
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce(null);

        const result = await resolveConfigs({});

        expect(result.map((entry) => entry.path)).toEqual([
            "github-pull-request-initial-comment-config",
            "github-issue-initial-comment-config",
        ]);
        expect(getRepoConfig).toHaveBeenNthCalledWith(1, {}, ".github/botstrap.yml");
        expect(getRepoConfig).toHaveBeenNthCalledWith(
            2,
            {},
            ".github/github-pull-request-initial-comment-config.yml",
        );
        expect(getRepoConfig).toHaveBeenNthCalledWith(
            3,
            {},
            ".github/github-issue-initial-comment-config.yml",
        );
    });
});
