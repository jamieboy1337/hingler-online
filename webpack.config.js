const path = require("path");
const webpack = require("webpack");

module.exports = [{
  plugins: [
    new webpack.IgnorePlugin({
      resourceRegExp: /perf_hooks/
    })
  ],
  
  entry: {
    client: "./client/index.ts",
    drawtest2: "./client/ts/drawtest2.ts"
  },

  mode: "development",
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: "/node_modules/"
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },

  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "client/js")
  }
},

{
  plugins: [
    new webpack.IgnorePlugin({
      resourceRegExp: /perf_hooks/
    })
  ],

  entry: {
    drawtest: "./test/browser/drawtest",
    simpletest: "./test/browser/simpletest",
    shadertest: "./test/browser/shadertest",
    modeltest: "./test/browser/modeltest"
  },

  mode: "development",
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader"
      }
    ]
  },

  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  },

  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "test/browser/js")
  }
}
]