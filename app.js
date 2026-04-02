const { dispatchEvent } = require("./lib/core/dispatch");

module.exports = (app) => {
    app.on("pull_request.opened", async (context) => {
        await dispatchEvent("pull_request.opened", context);
    });
};