const { moduleRegistry } = require("./registry");
const { getRepoConfig } = require("../utils/get-repo-config");
const { safeRun } = require("../utils/safe-run");

async function dispatchEvent(eventName, context) {
    const config = await getRepoConfig(context);

    for (const module of moduleRegistry) {
        const enabled = config.modules?.[module.key]?.enabled === true;
        const supportsEvent = module.events.includes(eventName);

        if (!enabled || !supportsEvent) {
            continue;
        }

        const moduleConfig = config.modules[module.key];

        await safeRun(module.key, async () => {
            await module.handle(context, moduleConfig);
        }, context);
    }
}

module.exports = { dispatchEvent };