const path = require("node:path");
const { config } = require("node:process");
const { safeRun } = require("./safe-run");

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

async function runBots(context, configs, eventName) {
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

                if (moduleWithHandle.events && !moduleWithHandle.events.includes(eventName)) {
                    continue;
                }
                await safeRun(configName.path, async () => {
                    const result = await moduleWithHandle.handle(context, configName.config, eventName);
                    results.push(result);
                }, context);
            } catch (error) {
                if (context?.log?.error) {
                    context.log.error({ error }, "Module loading failed");
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