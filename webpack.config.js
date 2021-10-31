const path = require("path");
const webpack = require("webpack");

module.exports = [{
  plugins: [
    new webpack.IgnorePlugin({
      resourceRegExp: /perf_hooks/
    })
  ],
  
  entry: {
    client: "./client/index",
    drawtest2: "./client/ts/drawtest2",
    maptest: "./client/ts/maptest",
    countertest: "./client/ts/countertest",
    swaptest: "./client/ts/swaptest",
    watertest: "./client/ts/watertest"
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
    sw: "./client/ts/service-worker/sw.ts"
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
    path: path.resolve(__dirname, "client")
  }
}
]
