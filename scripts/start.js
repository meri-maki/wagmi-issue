const Webpack = require("webpack")
const WebpackDevServer = require("webpack-dev-server")
const config = require("../config/webpack.config")

const webpackConfig = config("development")
const compiler = Webpack(webpackConfig)
const devServerOptions = {
	...webpackConfig.devServer,
	open: true,
}

const server = new WebpackDevServer(devServerOptions, compiler)

const runServer = async () => {
	console.log("Starting server...")
	await server.start()
}

runServer()
