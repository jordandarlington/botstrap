const yaml = require("js-yaml");
const { getRepoFile } = require("../github/get-repo-file");

async function getRepoConfig(context, path = ".github/botstrap.yml") {
    try {
        const content = await getRepoFile(context, path);
        return yaml.load(content) || { module: {} };
    } catch { 
        return { modules: {} };
    }
}

module.exports = { getRepoConfig };
