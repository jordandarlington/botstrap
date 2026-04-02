const { moduleRegistry } = require("./registry");
const { getRepoConfig } = require("../utils/get-repo-config");
const { safeRun } = require("../utils/safe-run");

async function dispatchEvent(eventName, context) {
    context.log.info({ eventName }, "Dispatch received event");

    const config = (await getRepoConfig(context)) || { global: {}, modules: {} };
    const globalConfig = config.global || {};

    context.log.info({ config }, "Loaded repo config");

    for (const module of moduleRegistry) {
        // const enabled = config.modules?.[module.key]?.enabled === true;
        const enabled = true;
        const supportsEvent = module.events.includes(eventName);

        context.log.info({ module: module.key, enabled, supportsEvent }, "Evaluating module");

        if (!enabled || !supportsEvent) {
            continue;
        }

        const moduleConfig = { ...globalConfig, ...config.modules?.[module.key] };

        context.log.info({ module: module.key, moduleConfig }, "Running module");

        await safeRun(module.key, async () => {
            await module.handle(context, moduleConfig);
        }, context);
    }
}

module.exports = { dispatchEvent };