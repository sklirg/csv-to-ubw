const { CheckerPlugin } = require("awesome-typescript-loader");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const WriteFilePlugin = require("write-file-webpack-plugin");

module.exports = {
  entry: {
    extension: "./src/index.ts"
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "babel-loader",
        exclude: /node_modules/,
        resolve: {
          extensions: [".js", ".ts"]
        }
      }
    ]
  },
  plugins: [
    new CheckerPlugin(),
    new CopyWebpackPlugin([
      {
        from: "src/manifest.json",
        to: "manifest.json"
      }
    ]),
    new WriteFilePlugin()
  ]
};
