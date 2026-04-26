const { getModules } = require("./registry");
const { getRepoConfig } = require("../utils/get-repo-config");
const { runBots } = require("../utils/bot-runner");

async function dispatchEvent(eventName, context) {
    context.log.info({ eventName }, "Dispatch received event");

    const config = (await getRepoConfig(context)) || { global: {}, modules: {} };
    const globalConfig = config.global || {};

    context.log.info({ config }, "Loaded repo config");

    const modules = await getModules(context);
    context.log.info({ modules: modules.map(m => Object.keys(m)[0]) }, "Modules to evaluate");

    const botsConfigs = modules
        .map((moduleObj) => {
            const [path, moduleConfig] = Object.entries(moduleObj)[0];
            return { path, config: moduleConfig };
        })
        .filter((item) => item.config?.enabled === true);

    context.log.info({ enabledModules: botsConfigs.map(c => c.path) }, "Enabled modules to run");

    await runBots(context, botsConfigs, eventName, { runtime: "github" });
}

module.exports = { dispatchEvent };
