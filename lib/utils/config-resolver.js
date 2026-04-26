const fs = require("node:fs/promises");
const path = require("node:path");
const yaml = require("js-yaml");
const { getRepoConfig } = require("./get-repo-config");

const basePath = ".github/";

const configFilePaths = [
    "github-pull-request-initial-comment-config",
    "github-issue-initial-action-config",
    "github-branch-protection-status-config",
    "github-draft-pull-request-comment-config",
]

async function resolveConfigs(context, subscribedModules) {
    const botstrapConfig = subscribedModules
        ? { modules: subscribedModules }
        : await getRepoConfig(context, ".github/botstrap.yml");

    if (!Array.isArray(botstrapConfig?.modules)) {
        throw new Error("Invalid botstrap configuration: 'modules' key is missing");
    }

    const configs = [];

    for (const configPath of configFilePaths) {
        if (botstrapConfig.modules.includes(configPath)) {
            const config = await getRepoConfig(context, basePath + configPath + ".yml");

            if (!config) {
                const defaultConfig = await getDefaultConfig(configPath);
                configs.push({ path: configPath, config: defaultConfig });
            } else {
                configs.push({ path: configPath, config });
            }
        }
    }

    return configs;
}

async function getDefaultConfig(configName) {
    const defaultConfigYamlPath = path.resolve(__dirname, "../config", configName + ".yml");
    try {
        const rawYaml = await fs.readFile(defaultConfigYamlPath, "utf8");
        return yaml.load(rawYaml) || {};
    } catch {
        return {};
    }
}

module.exports = { resolveConfigs };
