"use strict"

const path = require("path")
const fs = require("fs")

const appDirectory = fs.realpathSync(process.cwd())
const resolveApp = (relativePath) => path.resolve(appDirectory, relativePath)

module.exports = {
	appPath: resolveApp("."),
	appBuild: resolveApp("build"),
	appRelease: resolveApp("dist"),
	appPublic: resolveApp("public"),
	appPackageJson: resolveApp("package.json"),
	appSrc: resolveApp("src"),
}
