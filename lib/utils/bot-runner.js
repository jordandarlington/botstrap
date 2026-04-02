const path = require("node:path");
const { config } = require("node:process");

function resolveHandleExport(moduleExports) {
    if (moduleExports && typeof moduleExports.handle === "function") {
        return moduleExports;
    }

    if (!moduleExports || typeof moduleExports !== "object") {
        return null;
    }

    for (const value of Object.values(moduleExports)) {
        if (value && typeof value.handle === "function") {
            return value;
        }
    }

    return null;
}

async function runBots(context, configs) {
    try {
        if (!Array.isArray(configs)) {
            return [];
        }

        const results = [];

        for (const configName of configs) {

            const modulePath = path.resolve(__dirname, "../modules", `${configName.path}.js`);

            try {
                delete require.cache[require.resolve(modulePath)];
                const loadedModule = require(modulePath);
                const moduleWithHandle = resolveHandleExport(loadedModule);

                if (!moduleWithHandle) {
                    continue;
                }

                const result = await moduleWithHandle.handle(context, configName.config);
                results.push(result);
            } catch (error) {
                if (context?.log?.error) {
                    context.log.error({ moduleKey, error }, "Module execution failed");
                }
            }
        }

        return results;
    } catch (error) {
        if (context?.log?.error) {
            context.log.error({ error }, "Bot runner failed");
        }

        return [];
    }
}

module.exports = { runBots };