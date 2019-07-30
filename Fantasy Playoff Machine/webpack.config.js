const path = require('path');
const webpack = require('webpack');
const AssetsPlugin = require('assets-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const autoprefixer = require('autoprefixer');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

const browsers = [
	"Android 2.3",
	"Android >= 4",
	"Chrome >= 35",
	"Firefox >= 31",
	"Explorer >= 10",
	"iOS >= 7",
	"Opera >= 12",
	"Safari >= 7.1"
];

module.exports = function (env, argv) {
	const prod = argv.mode === 'production';
	const dev = !prod;

	return {
		mode: prod ? 'production' : 'development',
		// include typescript sourcemaps
		devtool: dev ? 'sourcemap' : undefined,
		entry: {
			'react': './Client'
		},
		output: {
			path: path.join(__dirname, "build"),
			publicPath: '/build/',
			filename: '[name].js?[chunkhash]',
			chunkFilename: '[name].js?[chunkhash]'
		},
		resolve: {
			alias: {
				'~': path.join(__dirname, 'Client')
			},
			extensions: ['.tsx', '.ts', '.jsx', '.js']
		},
		externals: {
			angular: 'angular'
		},
		module: {
			rules: [
				// rules for scripts
				{
					/**
					 * So, I did some experimentation, and it turns out that typescript actually
					 * generates smaller bundles than babel. Go figure.
					 * What this means is that we don't have to use babel at all, and typescript
					 * can be used to bundle both TS and JS files.
					 */
					test: /\.(j|t)sx?$/,
					include: [
						path.resolve(__dirname, 'Client'),
						path.resolve(__dirname, 'Scripts'),
						/node_modules[\\/]@duel/
					],
					exclude: /\bScripts[\\/](Vendor)\b/,
					use: {
						loader: 'ts-loader',
						options: {
							configFile: path.resolve(__dirname, 'Client/tsconfig.json'),
							compilerOptions: { 
								allowJs: true, 
								sourceMap: dev 
							},
							// disable type checking for faster compilation
							transpileOnly: true
						}
					}
				},
				// rules for styles
				{
					test: /\.s?css$/,
					use: [
						MiniCssExtractPlugin.loader,
						{
							loader: 'css-loader',
							options: {
								sourceMap: dev,
								modules: 'global',
								localIdentName: dev ? '[name]_[local]_[hash:base64:3]' : '[hash:base64:4]'
							}
						}, {
							loader: 'postcss-loader',
							options: {
								sourceMap: dev,
								plugins: () => [autoprefixer(browsers)]
							}
						}, {
							loader: 'sass-loader',
							options: { sourceMap: dev }
						}
					]
				},
				// rules for assets
				{
					test: /\.(eot|woff2?|ttf|svg|png|jpe?g)(\?v=\d+\.\d+\.\d+)?$/,
					loader: 'url-loader',
					query: {
						limit: 10000,
						name: dev ? '[name].[ext]?[hash]' : '[hash].[ext]'
					}
				}
			]
		},
		plugins: [
			new webpack.DefinePlugin({
				'process.env.NODE_ENV': dev ? '"development"' : '"production"',
				__DEV__: dev
			}),
			new AssetsPlugin({ path: path.join(__dirname, "build") }),
			new MiniCssExtractPlugin({ filename: '[name].css?[contenthash]' }),
			new ForkTsCheckerWebpackPlugin({
				tsconfig: path.resolve(__dirname, 'Client/tsconfig.json')
			}),
			...dev ? [] : [
				new webpack.optimize.AggressiveMergingPlugin(),
			]
		],
		performance: {
			// Remove `prod &&` to see bundle size warnings.
			// This is enabled only for prod because it tends to clutter the output
			hints: prod && 'warning'
		},
		optimization: {
			minimizer: [
				new OptimizeCssAssetsPlugin({}),
			]
		},
		stats: {
			children: false,
			/**
			 * true = hide warning
			 * false = show warning
			 */
			warningsFilter: (warning) => {
				/**
				 * We use mini-css-extract-plugin to merge all of our CSS files into one.
				 * It does this according to the order that you list CSS imports.
				 * If a file imports multiple CSS files, the first imported will be first in the merged file.
				 * If two files import the same set of multiple CSS files in a different order,
				 * the plugin doesn't know how to order them in the result, and will emit a warning specifying this.
				 * Unfortunately, this effect is recursive. Two CSS files may be conflicted because
				 * ancestor imports have a conflicting order. This is very difficult to track down.
				 * 
				 * Now, most of our CSS files are independent, and the order doesn't matter.
				 * One suggested solution is to ensure that your imports are always sorted (perhaps alphabetically).
				 * The fact that our imports are unsorted is very likely the reason that we are getting these warnings.
				 * However, we need to ensure that our CSS files are *not* dependent on the order that they are specified.
				 * 
				 * Why does this matter? CSS precedence rules are based on ordering.
				 * If two rules specify the same property, the one that appears later in the file takes precedence.
				 * As mentioned above, for the most part this isn't an issue because we tend to use unique classes/ids.
				 * However, there are likely places where we don't use unique classes/ids.
				 * We will need to do a full audit of our CSS at some point to determine if this is the case.
				 * 
				 * The complete solution to this problem will be a combination of the following:
				 * - use CSS modules everywhere to ensure that our CSS is independent of ordering (a LARGE effort)
				 * - sort all of our imports (even TS/JS imports) alphabetically (easy, but time consuming)
				 */
				if (/Conflicting order between/.test(warning)) return true;
				return false;
			}
		}
	};
};
