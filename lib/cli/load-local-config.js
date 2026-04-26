const fs = require("node:fs/promises");
const path = require("node:path");
const yaml = require("js-yaml");

class MissingConfigError extends Error {
    constructor(configPath, resolvedPath) {
        super(`No Botstrap config found at ${configPath}`);
        this.name = "MissingConfigError";
        this.configPath = configPath;
        this.resolvedPath = resolvedPath;
    }
}

async function loadLocalConfig(cwd = process.cwd(), configPath = ".github/botstrap.yml") {
    const resolvedPath = path.resolve(cwd, configPath);
    let rawConfig;

    try {
        rawConfig = await fs.readFile(resolvedPath, "utf8");
    } catch (error) {
        if (error.code === "ENOENT") {
            throw new MissingConfigError(configPath, resolvedPath);
        }

        throw error;
    }

    return {
        config: yaml.load(rawConfig) || {},
        path: resolvedPath,
    };
}

module.exports = {
    MissingConfigError,
    loadLocalConfig,
};
