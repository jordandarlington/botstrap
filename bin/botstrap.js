#!/usr/bin/env node

const { flush, handle } = require("@oclif/core");
const {
    CapabilitiesCommand,
    ConfigValidateCommand,
    InitCommand,
    ModulesCommand,
    RunCommand,
} = require("../lib/cli/commands");

const commandMap = {
    capabilities: CapabilitiesCommand,
    "config:validate": ConfigValidateCommand,
    init: InitCommand,
    modules: ModulesCommand,
    run: RunCommand,
};

async function main(argv) {
    let [commandName, ...commandArgs] = argv;

    if (commandName === "config" && commandArgs[0] === "validate") {
        commandName = "config:validate";
        commandArgs = commandArgs.slice(1);
    }

    if (commandName === "list" && commandArgs[0]) {
        commandName = commandArgs[0];
        commandArgs = commandArgs.slice(1);
    }

    const Command = commandMap[commandName || "modules"];

    if (!Command) {
        throw new Error(`Unknown command '${commandName}'`);
    }

    await Command.run(commandArgs);
}

main(process.argv.slice(2))
    .then(flush)
    .catch(handle);
