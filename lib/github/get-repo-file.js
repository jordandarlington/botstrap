async function getRepoFile(context, path) {
    const owner = context.payload.repository.owner.login;
    const repo = context.payload.repository.name;

    const response = await context.octokit.repos.getContent({
        owner,
        repo,
        path,
    });

    if (!("content" in response.data)) {
        throw new Error(`${path} is not a regular file`);
    }

    return Buffer.from(response.data.content, "base64").toString("utf-8");
}

module.exports = { getRepoFile };