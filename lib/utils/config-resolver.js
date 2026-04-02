const fs = require("node:fs/promises");
const path = require("node:path");
const yaml = require("js-yaml");
const { getRepoConfig } = require("./get-repo-config");

const basePath = ".github/";

const configFilePaths = [
    "global-config",
    "teams-notifier-config",
    "branch-locker-config",
    "semantics-analyser-config",
    "risk-predictor-config",
]

async function resolveConfigs(context) {
    const botstapConfig = await getRepoConfig(context, ".github/botstrap.yml");
    const subscribedModules = botstapConfig ? botstapConfig.modules : null;

    if (!Array.isArray(subscribedModules)) {
        throw new Error("Invalid botstrap configuration: 'modules' key is missing");
    }
    let configs = [];
    try {
        for (const configPath of configFilePaths) {
            if (subscribedModules && subscribedModules.includes(configPath)) {
                const config = await getRepoConfig(context, basePath + configPath + ".yml");
                if(!config) {
                    const defaultConfig = await getDefaultConfig(configPath);
                    configs.push({ path: configPath, config: defaultConfig });
                } else {
                    configs.push({ path: configPath, config: config });
                }
            }
        }
        return configs;
    } catch { 
        return { modules: {} };
    }
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