async function safeRun(moduleKey, fn, context) {
    try {
        await fn();
    } catch (error) {
        if (context?.failFast) {
            throw error;
        }

        context.log.error(
            {
                moduleKey,
                error: {
                    message: error.message,
                    status: error.status,
                    name: error.name,
                    documentation_url: error.response?.data?.documentation_url,
                    errors: error.response?.data?.errors,
                },
            },
            "Module execution failed",
        );
    }
}

module.exports = { safeRun };
