const { dispatchEvent } = require("./lib/core/dispatch");

module.exports = (app) => {
    app.on("pull_request.opened", async (context) => {
        await dispatchEvent("pull_request.opened", context);
    });
        
    app.on("pull_request.reopened", async (context) => {
        await dispatchEvent("pull_request.reopened", context);
    });
};