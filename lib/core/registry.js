const { getRepoConfig } = require("../utils/get-repo-config");
const { riskPredictorModule } = require("../modules/risk-predictor");
const { branchLockerModule } = require("../modules/branch-locker");
const { semanticsAnalyserModule } = require("../modules/semantics-analyser");
const { teamsNotifierModule } = require("../modules/teams-notifier");

const moduleRegistry = [
    riskPredictorModule,
    branchLockerModule,
    semanticsAnalyserModule,
    teamsNotifierModule,
];

async function getModules(context) {
    const eventName = context.name ? `${context.name}.${context.payload.action}` : "unknown";
    context.log.info({ eventName }, "Dispatch received event");

    const botstrapConfig = await getRepoConfig(context, ".github/botstrap.yml");
    const subscribedModules = botstrapConfig ? botstrapConfig.modules : null;
    context.log.info({ subscribedModules }, "Subscribed modules from botstrap config");

    if (!subscribedModules || Array.isArray(subscribedModules)) {
        return subscribedModules || [];
    }

    return Object.entries(subscribedModules).map(([moduleName, moduleConfig]) => ({
        [moduleName]: moduleConfig,
    }));
}

module.exports = {
    getModules,
};