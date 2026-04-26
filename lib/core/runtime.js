function supportsRuntime(definition, runtime) {
    if (!runtime) {
        return true;
    }

    const runtimes = definition?.runtimes || ["github"];
    return runtimes.includes(runtime);
}

module.exports = { supportsRuntime };
