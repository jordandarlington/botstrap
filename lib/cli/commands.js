const fs = require("node:fs/promises");
const path = require("node:path");
const { Command, Args, Flags } = require("@oclif/core");
const boxen = require("boxen");
const chalk = require("chalk");
const Table = require("cli-table3");
const { moduleRegistry } = require("../core/registry");
const { capabilityRegistry } = require("../core/capability-registry");
const { supportsRuntime } = require("../core/runtime");
const { MissingConfigError, loadLocalConfig } = require("./load-local-config");
const { runBots } = require("../utils/bot-runner");

const defaultConfigPath = ".github/botstrap.yml";
const exampleConfigPath = path.resolve(__dirname, "../../.github/botstrap.example.yml");

function formatRuntimes(runtimes = ["github"]) {
    return runtimes.join(", ");
}

function renderRegistryTable(title, rows) {
    const table = new Table({
        head: [
            chalk.cyan("Key"),
            chalk.cyan("Runtimes"),
            chalk.cyan("Description"),
        ],
        style: {
            head: [],
            border: [],
        },
        wordWrap: true,
    });

    table.push(...rows);

    return [
        boxen(chalk.bold(title), {
            borderColor: "cyan",
            padding: 1,
            margin: 0,
        }),
        table.toString(),
    ].join("\n");
}

function getSubscribedModuleEntries(config) {
    const subscribedModules = config.modules;

    if (!subscribedModules) {
        return [];
    }

    if (Array.isArray(subscribedModules)) {
        return subscribedModules.map((moduleName) => [moduleName, { enabled: true }]);
    }

    return Object.entries(subscribedModules);
}

function validateConfig(config) {
    const errors = [];
    const warnings = [];

    if (!config.modules || (!Array.isArray(config.modules) && typeof config.modules !== "object")) {
        errors.push("'modules' must be an array or object");
        return { errors, warnings };
    }

    const moduleKeys = new Set(moduleRegistry.map((module) => module.key));
    const capabilityKeys = new Set(capabilityRegistry.map((capability) => capability.key));

    for (const [moduleKey, moduleConfig] of getSubscribedModuleEntries(config)) {
        const moduleDefinition = moduleRegistry.find((module) => module.key === moduleKey);

        if (!moduleKeys.has(moduleKey)) {
            errors.push(`Unknown module '${moduleKey}'`);
            continue;
        }

        if (!supportsRuntime(moduleDefinition, "cli")) {
            warnings.push(`Module '${moduleKey}' is not CLI-enabled`);
        }

        const configuredCapabilities = moduleConfig?.capabilities || {};
        for (const capabilityKey of Object.keys(configuredCapabilities)) {
            if (!capabilityKeys.has(capabilityKey)) {
                errors.push(`Unknown capability '${capabilityKey}' configured for module '${moduleKey}'`);
            }
        }
    }

    return { errors, warnings };
}

function renderMissingConfig(error) {
    return [
        boxen(chalk.yellow.bold("No Botstrap config found"), {
            borderColor: "yellow",
            padding: 1,
        }),
        `Expected: ${chalk.bold(error.configPath)}`,
        "",
        `Create one with: ${chalk.cyan("botstrap init")}`,
    ].join("\n");
}

async function initConfig(cwd = process.cwd(), configPath = defaultConfigPath, options = {}) {
    const targetPath = path.resolve(cwd, configPath);
    const template = await fs.readFile(exampleConfigPath, "utf8");

    try {
        await fs.mkdir(path.dirname(targetPath), { recursive: true });
        await fs.writeFile(targetPath, template, {
            encoding: "utf8",
            flag: options.force ? "w" : "wx",
        });
    } catch (error) {
        if (error.code === "EEXIST") {
            return {
                created: false,
                path: targetPath,
            };
        }

        throw error;
    }

    return {
        created: true,
        path: targetPath,
    };
}

class ModulesCommand extends Command {
    async run() {
        const rows = moduleRegistry.map((module) => [
            chalk.bold(module.key),
            formatRuntimes(module.runtimes),
            module.description || "",
        ]);

        this.log(renderRegistryTable("Botstrap Modules", rows));
    }
}

class CapabilitiesCommand extends Command {
    async run() {
        const rows = capabilityRegistry.map((capability) => [
            chalk.bold(capability.key),
            formatRuntimes(capability.runtimes),
            capability.description || "",
        ]);

        this.log(renderRegistryTable("Botstrap Capabilities", rows));
    }
}

class ConfigValidateCommand extends Command {
    static flags = {
        config: Flags.string({
            char: "c",
            default: ".github/botstrap.yml",
            description: "Path to botstrap config, relative to cwd",
        }),
        cwd: Flags.string({
            default: process.cwd(),
            description: "Repository directory",
        }),
    };

    async run() {
        const { flags } = await this.parse(ConfigValidateCommand);
        let loadedConfig;

        try {
            loadedConfig = await loadLocalConfig(flags.cwd, flags.config);
        } catch (error) {
            if (error instanceof MissingConfigError) {
                this.log(renderMissingConfig(error));
                this.exit(1);
            }

            throw error;
        }

        const { config, path } = loadedConfig;
        const { errors, warnings } = validateConfig(config);

        if (errors.length > 0) {
            this.log(chalk.red.bold("Config invalid"));
            errors.forEach((error) => this.log(`${chalk.red("x")} ${error}`));
            this.exit(1);
        }

        this.log(boxen(chalk.green.bold("Config valid"), {
            borderColor: "green",
            padding: 1,
        }));
        this.log(chalk.dim(path));

        warnings.forEach((warning) => this.log(`${chalk.yellow("!")} ${warning}`));
    }
}

class InitCommand extends Command {
    static flags = {
        config: Flags.string({
            char: "c",
            default: defaultConfigPath,
            description: "Path to create, relative to cwd",
        }),
        cwd: Flags.string({
            default: process.cwd(),
            description: "Repository directory",
        }),
        force: Flags.boolean({
            char: "f",
            default: false,
            description: "Overwrite an existing config file",
        }),
    };

    async run() {
        const { flags } = await this.parse(InitCommand);
        const result = await initConfig(flags.cwd, flags.config, {
            force: flags.force,
        });

        if (!result.created) {
            this.log(boxen(chalk.yellow.bold("Botstrap config already exists"), {
                borderColor: "yellow",
                padding: 1,
            }));
            this.log(chalk.dim(result.path));
            this.log(`Use ${chalk.cyan("botstrap init --force")} to overwrite it.`);
            return;
        }

        this.log(boxen(chalk.green.bold("Botstrap config created"), {
            borderColor: "green",
            padding: 1,
        }));
        this.log(chalk.dim(result.path));
    }
}

class RunCommand extends Command {
    static args = {
        module: Args.string({
            description: "Module key to run",
            required: true,
        }),
    };

    static flags = {
        config: Flags.string({
            char: "c",
            default: ".github/botstrap.yml",
            description: "Path to botstrap config, relative to cwd",
        }),
        cwd: Flags.string({
            default: process.cwd(),
            description: "Repository directory",
        }),
        "dry-run": Flags.boolean({
            default: false,
            description: "Validate the selected module without running capabilities",
        }),
        owner: Flags.string({
            description: "GitHub repository owner for CLI GitHub capabilities",
        }),
        repo: Flags.string({
            description: "GitHub repository name for CLI GitHub capabilities",
        }),
        branch: Flags.string({
            description: "GitHub branch name for CLI GitHub capabilities",
        }),
        branches: Flags.string({
            description: "Comma-separated GitHub branch names for CLI GitHub capabilities",
        }),
        token: Flags.string({
            description: "GitHub token for CLI GitHub capabilities. Defaults to GITHUB_TOKEN",
        }),
    };

    async run() {
        const { args, flags } = await this.parse(RunCommand);
        const moduleDefinition = moduleRegistry.find((module) => module.key === args.module);

        if (!moduleDefinition) {
            this.error(`Unknown module '${args.module}'`, { exit: 1 });
        }

        if (!supportsRuntime(moduleDefinition, "cli")) {
            this.error(`Module '${args.module}' is not CLI-enabled`, { exit: 1 });
        }

        let loadedConfig;

        try {
            loadedConfig = await loadLocalConfig(flags.cwd, flags.config);
        } catch (error) {
            if (error instanceof MissingConfigError) {
                this.log(renderMissingConfig(error));
                this.exit(1);
            }

            throw error;
        }

        const { config } = loadedConfig;
        const moduleConfig = {
            ...Object.fromEntries(getSubscribedModuleEntries(config))[args.module],
        };

        const runtimeOverrides = {};

        for (const key of ["owner", "repo", "branch", "token"]) {
            if (flags[key]) {
                runtimeOverrides[key] = flags[key];
            }
        }

        if (flags.branches) {
            runtimeOverrides.branches = flags.branches
                .split(",")
                .map((branch) => branch.trim())
                .filter(Boolean);
            delete runtimeOverrides.branch;
        }

        moduleConfig.runtimeOverrides = runtimeOverrides;

        if (!moduleConfig?.enabled) {
            this.error(`Module '${args.module}' is not enabled in ${flags.config}`, { exit: 1 });
        }

        if (flags["dry-run"]) {
            this.log(chalk.green(`Module '${args.module}' is configured and CLI-enabled.`));
            return;
        }

        const context = {
            cwd: flags.cwd,
            runtime: "cli",
            log: {
                error: (details, message) => this.log(chalk.red(message || details)),
                info: (details, message) => {
                    if (message) {
                        this.log(chalk.dim(message));
                    }
                },
            },
        };

        const results = await runBots(
            context,
            [{ path: args.module, config: moduleConfig }],
            null,
            { runtime: "cli" },
        );

        results
            .filter((result) => result !== undefined)
            .forEach((result) => this.log(JSON.stringify(result, null, 2)));

        this.log(chalk.green(`Module '${args.module}' completed.`));
    }
}

module.exports = {
    CapabilitiesCommand,
    ConfigValidateCommand,
    InitCommand,
    ModulesCommand,
    RunCommand,
    initConfig,
    renderMissingConfig,
    validateConfig,
};
