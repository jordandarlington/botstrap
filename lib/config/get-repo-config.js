const yaml = require("js-yaml");
const { getRepoFile } = require("../github/get-repo-file");

async function getRepoConfig(context) {
    try {
        const content = await getRepoFile(context, ".github/botstrap.yml");
        return yaml.load(content) || { module: {} };
    } catch { 
        return { modules: {} };
    }
}

module.exports = { getRepoConfig };