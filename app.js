const { dispatchEvent } = require("./lib/core/dispatch");

module.exports = (app) => {
    app.on("pull_request.opened", async (context) => {
        await dispatchEvent("pull_request.opened", context);
    });
        
    app.on("pull_request.reopened", async (context) => {
        await dispatchEvent("pull_request.reopened", context);
    });

    app.on("pull_request.converted_to_draft", async (context) => {
        await dispatchEvent("pull_request.converted_to_draft", context);
    });

    app.on("issues.opened", async (context) => {
        await dispatchEvent("issues.opened", context);
    });

    app.on("issue_comment.created", async (context) => {
        await dispatchEvent("issue_comment.created", context);
    });
};
