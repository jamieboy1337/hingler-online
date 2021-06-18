const path = require("path");

module.exports = [{
  entry: {
    client: "./client/index.ts",
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
  entry: {
    simpletest: "./test/browser/simpletest",
    shadertest: "./test/browser/shadertest"
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