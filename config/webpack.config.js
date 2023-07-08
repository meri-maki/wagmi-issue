const packageJson = require("../package.json")
const path = require("path")
const paths = require("./paths")
const Webpack = require("webpack")
const HtmlWebpackPlugin = require("html-webpack-plugin")
const MiniCssExtractPlugin = require("mini-css-extract-plugin")
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin")
const HtmlMinimizerPlugin = require("html-minimizer-webpack-plugin")
const Dotenv = require("dotenv-webpack")

module.exports = function (buildMode) {
	const isProduction = buildMode === "production"
	const isDevelopment = !isProduction

	const htmlFiles = [
		{
			template: "public/purchase.html",
			chunks: ["common", "purchase"],
		},
	]

	return {
		mode: buildMode,
		entry: {
			purchase: "./src/pages/purchase.js",
		},
		output: {
			filename: "js/[name].[contenthash:8].js",
			path: paths.appBuild,
			pathinfo: false,
			globalObject: "this",
			chunkLoadingGlobal: `myApp${packageJson.name}`,
		},
		optimization: {
			minimize: isProduction,
			minimizer: [
				`...`, // default terser config
				new CssMinimizerPlugin(),
				new HtmlMinimizerPlugin(),
			],
		},

		plugins: [
			...htmlFiles.map((htmlFile) => {
				return new HtmlWebpackPlugin({
					filename: htmlFile.filename || path.basename(htmlFile.template),
					template: htmlFile.template,
					minify: false,
					chunks: htmlFile.chunks,
					inject: "body",
				})
			}),
			new MiniCssExtractPlugin({
				filename: "css/[name].[contenthash:8].css",
				chunkFilename: "css/[name].[contenthash:8].chunk.css",
			}),
			new Webpack.ProvidePlugin({
				process: "process/browser",
				Buffer: ["buffer", "Buffer"],
			}),
			new Dotenv(),
		],
		resolve: {
			fallback: {
				crypto: require.resolve("crypto-browserify"),
				stream: require.resolve("stream-browserify"),
				assert: require.resolve("assert"),
				http: require.resolve("stream-http"),
				https: require.resolve("https-browserify"),
				os: require.resolve("os-browserify"),
				url: require.resolve("url"),
				zlib: require.resolve("browserify-zlib"),
				path: require.resolve("path-browserify"),
			},
		},
		module: {
			rules: [
				{
					test: /\.(js)$/i,
					include: paths.appSrc,
					exclude: /\/node_modules\//,
					use: {
						loader: "babel-loader",
						options: {
							presets: ["@babel/preset-env"],
						},
					},
				},
				{
					test: /\.jsx?$/,
					exclude: /node_modules/,
					use: {
						loader: "babel-loader",
					},
				},
				{
					test: /\.(s(a|c)ss)$/,
					include: paths.appSrc,
					exclude: /\/node_modules\//,
					use: [
						isProduction ? MiniCssExtractPlugin.loader : "style-loader",

						{
							loader: "css-loader",
							options: {
								sourceMap: true,
								url: false,
							},
						},
						{
							loader: "postcss-loader",
							options: {
								sourceMap: true,
								postcssOptions: {
									plugins: [["autoprefixer", {}]],
								},
							},
						},
						{
							loader: "sass-loader",
							options: {
								sourceMap: true,
							},
						},
					],
				},
			],
		},
		devServer: {
			static: {
				directory: paths.appPublic,
			},
			hot: true,
			compress: true,
			port: 3000,
		},
		devtool: isProduction ? "source-map" : "inline-source-map",
	}
}
