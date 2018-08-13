var wallabyWebpack = require('wallaby-webpack');
var path = require('path');

var compilerOptions = Object.assign(
  require('./tsconfig.json').compilerOptions,
  <%= importCompilerOptions %>  
);

compilerOptions.module = 'CommonJs';

module.exports = function(wallaby) {
  var webpackPostprocessor = wallabyWebpack({
    entryPatterns: ['wallabyTest.js', 'apps/**/*spec.js', 'libs/**/*spec.js'],

    module: {
      rules: [
        { test: /\.css$/, loader: ['raw-loader'] },
        { test: /\.html$/, loader: 'raw-loader' },
        {
          test: /\.ts$/,
          loader: '@ngtools/webpack',
          include: /node_modules/,
          query: { tsConfigPath: 'tsconfig.json' }
        },
        {
          test: /\.js$/,
          loader: 'angular2-template-loader',
          exclude: /node_modules/
        },
        { test: /\.styl$/, loaders: ['raw-loader', 'stylus-loader'] },
        {
          test: /\.less$/,
          loaders: [
            'raw-loader',
            { loader: 'less-loader', options: { paths: [__dirname] } }
          ]
        },
        { test: /\.scss$|\.sass$/, loaders: ['raw-loader', 'sass-loader'] },
        { test: /\.(jpg|png|svg)$/, loader: 'url-loader?limit=128000' }
      ]
    },

    resolve: {
      extensions: ['.js', '.ts'],
      modules: [
        path.join(wallaby.projectCacheDir, 'apps'),
        path.join(wallaby.projectCacheDir, 'libs'),
        'node_modules'
      ],
      <%= importAlias %>
    },
    node: {
      fs: 'empty',
      net: 'empty',
      tls: 'empty',
      dns: 'empty'
    }
  });

  return {
    files: [
      { pattern: 'wallabyTest.ts', load: false },
      {
        pattern: 'apps/**/*.+(ts|css|less|scss|sass|styl|html|json|svg)',
        load: false
      },
      { pattern: 'apps/**/*.d.ts', ignore: true },
      { pattern: 'apps/**/*spec.ts', ignore: true },
      {
        pattern: 'libs/**/*.+(ts|css|less|scss|sass|styl|html|json|svg)',
        load: false
      },
      { pattern: 'libs/**/*.d.ts', ignore: true },
      { pattern: 'libs/**/*spec.ts', ignore: true },
      { pattern: 'apps/**/*-e2e/**', ignore: true },
      { pattern: 'libs/**/*-e2e/**', ignore: true }
    ],

    tests: [
      { pattern: 'apps/**/*spec.ts', load: false },
      { pattern: 'libs/**/*spec.ts', load: false },
      { pattern: 'apps/**/*-e2e/**', ignore: true },
      { pattern: 'libs/**/*-e2e/**', ignore: true }
    ],

    testFramework: 'jasmine',

    compilers: {
      '**/*.ts': wallaby.compilers.typeScript(compilerOptions)
    },

    env: {
      kind: 'chrome'
    },

    postprocessor: webpackPostprocessor,

    setup: function() {
      window.__moduleBundler.loadTests();
    },

    debug: true
  };
};
