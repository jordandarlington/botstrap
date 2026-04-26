const { getRepoConfig } = require("../utils/get-repo-config");
const { pullRequestGreetingModule } = require("../modules/pull-request-greeting");
const { issueGreetingModule } = require("../modules/issue-greeting");

const moduleRegistry = [
    pullRequestGreetingModule,
    issueGreetingModule,
];

async function getModules(context) {
    const eventName = context.name ? `${context.name}.${context.payload.action}` : "unknown";
    context.log.info({ eventName }, "Dispatch received event");

    const botstrapConfig = await getRepoConfig(context, ".github/botstrap.yml");
    const subscribedModules = botstrapConfig ? botstrapConfig.modules : null;
    context.log.info({ subscribedModules }, "Subscribed modules from botstrap config");

    if (!subscribedModules) {
        return [];
    }

    const subscribedModuleEntries = Array.isArray(subscribedModules)
        ? subscribedModules.map((moduleName) => [moduleName, { enabled: true }])
        : Object.entries(subscribedModules);

    const registeredModuleKeys = new Set(moduleRegistry.map((module) => module.key));

    return subscribedModuleEntries
        .filter(([moduleName]) => registeredModuleKeys.has(moduleName))
        .map(([moduleName, moduleConfig]) => ({
            [moduleName]: moduleConfig,
        }));
}

module.exports = {
    getModules,
    moduleRegistry,
};
