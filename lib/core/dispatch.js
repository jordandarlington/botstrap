const { moduleRegistry } = require("./registry");
const { getRepoConfig } = require("../utils/get-repo-config");
const { safeRun } = require("../utils/safe-run");

async function dispatchEvent(eventName, context) {
    const config = (await getRepoConfig(context)) || { global: {}, subscriptions: [], modules: {} };
    const globalConfig = config.global || {};

    for (const module of moduleRegistry) {
        const subscribed = config.subscriptions?.includes(module.key);
        const supportsEvent = module.events.includes(eventName);

        if (!subscribed || !supportsEvent) {
            continue;
        }

        const moduleConfig = { ...globalConfig, ...config.modules?.[module.key] };

        await safeRun(module.key, async () => {
            await module.handle(context, moduleConfig);
        }, context);
    }
}

module.exports = { dispatchEvent };