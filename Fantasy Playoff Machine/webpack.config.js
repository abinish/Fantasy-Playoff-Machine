const path = require("path");

module.exports = {
    entry: {
        app: path.resolve(__dirname, "Client/app.tsx")
    },
    output: {
        filename: "bundle.js",
        path: path.resolve(__dirname, "Scripts/dist"),
        publicPath: 'Scripts/dist'
    },
    resolve: {
        extensions: [".ts", ".tsx", ".js", ".jsx"],
        modules: [
            'node_modules'
          ] 
    },
    module: {
        rules: [
            // changed from { test: /\.jsx?$/, use: { loader: 'babel-loader' }, exclude: /node_modules/ },
            { test: /\.(t|j)sx?$/, use: { loader: 'ts-loader' }, exclude: /node_modules/ },
      
            // addition - add source-map support
            { enforce: "pre", test: /\.js$/, exclude: /node_modules/, loader: "source-map-loader" }
          ]
    },
    // addition - add source-map support
    devtool: "source-map",
    optimization: {
        minimize: false
    }
};