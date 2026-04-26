const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const {
    initConfig,
    renderMissingConfig,
    validateConfig,
} = require("../lib/cli/commands");
const {
    MissingConfigError,
    loadLocalConfig,
} = require("../lib/cli/load-local-config");

describe("cli commands", () => {
    it("validates configured modules and warns for github-only modules", () => {
        const result = validateConfig({
            modules: {
                "pull-request-greeting": {
                    enabled: true,
                    capabilities: {
                        "create-pull-request-comment": {
                            body: "Hello",
                        },
                    },
                },
            },
        });

        expect(result.errors).toEqual([]);
        expect(result.warnings).toEqual([
            "Module 'pull-request-greeting' is not CLI-enabled",
        ]);
    });

    it("reports unknown modules and capabilities", () => {
        const result = validateConfig({
            modules: {
                "unknown-module": {
                    enabled: true,
                },
                "issue-greeting": {
                    enabled: true,
                    capabilities: {
                        "unknown-capability": {},
                    },
                },
            },
        });

        expect(result.errors).toEqual([
            "Unknown module 'unknown-module'",
            "Unknown capability 'unknown-capability' configured for module 'issue-greeting'",
        ]);
    });

    it("throws a typed error when local config is missing", async () => {
        const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "botstrap-test-"));

        await expect(loadLocalConfig(tempDir)).rejects.toMatchObject({
            name: "MissingConfigError",
            configPath: ".github/botstrap.yml",
        });
    });

    it("renders friendly missing config guidance", () => {
        const output = renderMissingConfig(
            new MissingConfigError(".github/botstrap.yml", "/tmp/repo/.github/botstrap.yml"),
        );

        expect(output).toContain("No Botstrap config found");
        expect(output).toContain("Expected:");
        expect(output).toContain("botstrap init");
    });

    it("creates a starter botstrap config", async () => {
        const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "botstrap-test-"));

        const result = await initConfig(tempDir);
        const createdConfig = await fs.readFile(
            path.join(tempDir, ".github/botstrap.yml"),
            "utf8",
        );

        expect(result.created).toBe(true);
        expect(createdConfig).toContain("pull-request-greeting");
        expect(createdConfig).toContain("issue-greeting");
    });

    it("does not overwrite an existing config unless forced", async () => {
        const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "botstrap-test-"));
        const configPath = path.join(tempDir, ".github/botstrap.yml");
        await fs.mkdir(path.dirname(configPath), { recursive: true });
        await fs.writeFile(configPath, "modules: {}\n", "utf8");

        const skippedResult = await initConfig(tempDir);
        const skippedConfig = await fs.readFile(configPath, "utf8");
        const forcedResult = await initConfig(tempDir, ".github/botstrap.yml", {
            force: true,
        });
        const forcedConfig = await fs.readFile(configPath, "utf8");

        expect(skippedResult.created).toBe(false);
        expect(skippedConfig).toBe("modules: {}\n");
        expect(forcedResult.created).toBe(true);
        expect(forcedConfig).toContain("pull-request-greeting");
    });
});
