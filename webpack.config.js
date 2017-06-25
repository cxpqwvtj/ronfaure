const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')

const DEBUG = !(process.env.NODE_ENV === 'production')
const VERBOSE = process.argv.includes('--verbose')
const HOT_DEPLOY = !!process.env.HOT_DEPLOY
const CONTEXT_PATH = `${(process.env.CONTEXT_PATH || '')}`

const hotMiddlewareScript = 'webpack-hot-middleware/client?path=/__webpack_hmr&timeout=20000&reload=true'

function isExternal(module) {
  const userRequest = module.userRequest

  if (typeof userRequest !== 'string') {
    return false
  }

  return userRequest.indexOf('bower_components') >= 0 ||
         userRequest.indexOf('node_modules') >= 0 ||
         userRequest.indexOf('libraries') >= 0
}

module.exports = {
  context: __dirname + '/src/main/client',
  entry: {
    'js/bundle': [...(HOT_DEPLOY ? [hotMiddlewareScript] : []), './index.js']
  },
  output: {
    path: __dirname + '/src/main/resources/static',
    filename: 'assets/[name].js',
    publicPath: `${CONTEXT_PATH}/`
  },
  resolve: {
    extensions: ['.js', '.jsx']
  },
  devtool: DEBUG ? 'inline-source-map' : false,
  plugins: [
    new webpack.DefinePlugin({
      'process.env.CONTEXT_PATH': `"${CONTEXT_PATH}"`,
      'process.env.NODE_ENV': `"${process.env.NODE_ENV || (DEBUG ? 'development' : 'production')}"` 
    }),
    new webpack.optimize.CommonsChunkPlugin({
      name: 'js/vender',
      minChunks: function(module) {
        return isExternal(module)
      }
    }),
    ...(HOT_DEPLOY ? [new webpack.HotModuleReplacementPlugin()] : []),
    ...(DEBUG ? [] : [new webpack.optimize.AggressiveMergingPlugin(),
      new webpack.optimize.UglifyJsPlugin({ compress: { screw_ie8: true, warnings: VERBOSE } })
    ]),
    new HtmlWebpackPlugin({
      title: 'ronfaure',
      template: 'index.ejs'
    }),
    new CopyWebpackPlugin([
      { from: 'assets'}
    ])
  ],
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: ['babel-loader']
      },
      {
        test: /\.ejs$/,
        loader: 'ejs-loader'
      }
    ]
  }
}
