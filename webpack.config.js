const path = require("path");
const UglifyJsPlugin = require("uglifyjs-webpack-plugin");
const OpenBrowserPlugin = require("open-browser-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CleanWebpackPlugin = require("clean-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
  entry: "./index.js",
  output: {
    path: path.resolve(__dirname, "./dist"),
    filename: "js/bundle.[contenthash].js"
  },
  module: {
    rules: [
      // js loader
      {
        test: /\.js?$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["env"]
          }
        }
      },
      // scss loader
      {
        test: /\.(sa|sc|c)ss$/,
        use: [MiniCssExtractPlugin.loader, "css-loader", "sass-loader"]
      },
      {
        test: /\.(png|jpg)$/,
        use: [
          {
            loader: "url-loader",
            options: {
              limit: 8192
            }
          }
        ]
      }
    ]
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: "css/[name].[contenthash].css"
    }),
    new UglifyJsPlugin(),
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      title: "Your Project",
      filename: "index.html",
      template: "./index.html"
    }),
    new CopyPlugin([{ from: path.resolve(__dirname, "./src/assets"), to: "assets" }]),
    new OpenBrowserPlugin({
      url: "http://localhost:8080"
    })
  ]
};
