const path = require("node:path");
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

function resolveModuleExport(moduleExports) {
    const handleExport = resolveHandleExport(moduleExports);

    if (handleExport) {
        return handleExport;
    }

    if (!moduleExports || typeof moduleExports !== "object") {
        return null;
    }

    for (const value of Object.values(moduleExports)) {
        if (value && Array.isArray(value.capabilities)) {
            return value;
        }
    }

    return null;
}

function resolveCapabilityExport(capabilityExports) {
    return resolveHandleExport(capabilityExports);
}

function normalizeCapability(capability) {
    if (typeof capability === "string") {
        return { key: capability, config: {} };
    }

    return {
        key: capability.key,
        config: capability.config || {},
    };
}

function getCapabilityConfig(moduleConfig, capability) {
    const capabilityConfig = moduleConfig.capabilities?.[capability.key] || {};

    return {
        ...capability.config,
        ...moduleConfig,
        ...capabilityConfig,
    };
}

async function runCapabilities(context, moduleConfig, moduleWithCapabilities, eventName) {
    const results = [];

    for (const rawCapability of moduleWithCapabilities.capabilities) {
        const capability = normalizeCapability(rawCapability);
        const capabilityPath = path.resolve(__dirname, "../capabilities", `${capability.key}.js`);

        try {
            delete require.cache[require.resolve(capabilityPath)];
            const loadedCapability = require(capabilityPath);
            const capabilityWithHandle = resolveCapabilityExport(loadedCapability);

            if (!capabilityWithHandle) {
                continue;
            }

            const capabilityConfig = getCapabilityConfig(moduleConfig, capability);
            const result = await capabilityWithHandle.handle(context, capabilityConfig, eventName);
            results.push(result);
        } catch (error) {
            if (context?.log?.error) {
                context.log.error({ error, capability: capability.key }, "Capability loading failed");
            }
        }
    }

    return results;
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
                const moduleDefinition = resolveModuleExport(loadedModule);

                if (!moduleDefinition) {
                    continue;
                }

                if (moduleDefinition.events && !moduleDefinition.events.includes(eventName)) {
                    continue;
                }
                await safeRun(configName.path, async () => {
                    if (typeof moduleDefinition.handle === "function") {
                        const result = await moduleDefinition.handle(context, configName.config, eventName);
                        results.push(result);
                        return;
                    }

                    const capabilityResults = await runCapabilities(
                        context,
                        configName.config || {},
                        moduleDefinition,
                        eventName,
                    );
                    results.push(...capabilityResults);
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
