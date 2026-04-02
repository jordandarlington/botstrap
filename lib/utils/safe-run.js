async function safeRun(moduleKey, fn, context) {
    try {
        await fn();
    } catch (error) {
        context.log.error({ moduleKey, error}, "Module execution failed");
    }
}

module.exports = { safeRun };