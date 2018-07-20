const webpack = require('webpack');
const cssnano = require('cssnano');
const postcssPresetEnv = require('postcss-preset-env');
const postcssEasyImport = require('postcss-easy-import');

const resolve = path => require('path').resolve(__dirname, path);

module.exports = env => {
  const prod = env.mode === 'production';

  return {
    watchOptions: {
      ignored: '/node_modules/',
    },

    output: {
      filename: prod ? '[name].min.js' : '[name].js',
    },

    // Toolbar & iFrame
    entry: {
      iframe: resolve('src/iframe'),
      toolbar: resolve('src/toolbar'),
    },

    // Helper Functions
    resolve: {
      alias: {
        common: resolve('src/common'),
      },
    },

    // Expose environment variables
    plugins: [new webpack.EnvironmentPlugin(['npm_package_version'])],

    module: {
      rules: [
        // PostCSS
        {
          test: /\.css$/,
          use: [
            'raw-loader',
            {
              loader: 'postcss-loader',
              options: {
                sourceMap: 'inline',
                plugins: () => [postcssEasyImport(), postcssPresetEnv(), cssnano()],
              },
            },
          ],
        },

        // Babel
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: 'babel-loader',
        },

        // DataURI Image Loader
        {
          test: /\.(svg|jpg)$/,
          use: 'url-loader',
        },
      ],
    },
  };
};
