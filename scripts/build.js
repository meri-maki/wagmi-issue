const fs = require("fs-extra")
const Webpack = require("webpack")
const paths = require("../config/paths")
const config = require("../config/webpack.config")

fs.emptyDirSync(paths.appBuild)
fs.copySync(paths.appPublic, paths.appBuild, {
	dereference: true,
	filter: (file) => !/\.html$/.test(file),
})

const compileStartAt = Date.now()

Webpack(config("production")).run((err, stats) => {
	const compileEndAt = Date.now()

	if (err === null) {
		console.info(`Build compiled successfully in ${compileEndAt - compileStartAt} ms`)
	} else {
		console.error(err)
		return
	}

	fs.copySync(paths.appBuild, paths.appRelease, {})
	console.info("Build copied to release directory")
})
