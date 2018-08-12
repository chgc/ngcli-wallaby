# Requirement

- Angular CLI Version 6+

# Getting Started With ngcli-wallaby Schematics

This schematics will let you setup wallaby.js testing environment by simply run following command.

```
ng add ngcli-wallaby
```

After running `ng add ngcli-wallaby` command, it will do following things.

- Add the wallaby.js config file to the project.
- Add the wallaby.js test bootstrap file to the project.
- Exclude the src/wallabyTest.ts file in the tsconfig.json as it may affect Angular 2 AOT compilation.
- Run npm install wallaby-webpack angular2-template-loader --save-dev.

In default setup, it uses [Chrome (headless) runner](https://wallabyjs.com/docs/integration/chrome.html) as default runner instead electron. If you want to use electron, you can manually change it back by changing the env setting to env: {kind: 'electron'}, and run `npm i electron`

In this version, it only works on simple angular project. If you are using multi projects structure, this schematics will not work. Please be attantion to that.

# Nrwl Nx project

This schematics also works with NX project at first time.
If there is more apps or libs created later on, it needs to manual update wallaby.js file. Steps as follow

- Edit wallaby.js compilerOptions, add addition apps/libs tsconfig.spec.ts
  ```typescript
  var compilerOptions = Object.assign(
    require('./tsconfig.json').compilerOptions
    // Add here
  );
  ```
- If it's libs, it also needs to update `resolve.alias` part
  ```typescript
  resolve: {
      extensions: ['.js', '.ts'],
      modules: [
          path.join(wallaby.projectCacheDir, 'apps'),
          path.join(wallaby.projectCacheDir, 'libs'),
          'node_modules'
      ],
      // Add here
      alias: {
          '@myworkspacename/mylib': path.join(
          wallaby.projectCacheDir,
          'libs/mylib/src/index.ts'
          )
       }
  },
  ```

# Credit

Thanks to [TomWhiteOmni](https://github.com/TomWhiteOmni).

# Reference

- [ngCliWebpackSample](https://github.com/wallabyjs/ngCliWebpackSample)
- [angular-nx-wallaby](https://github.com/TomWhiteOmni/angular-nx-wallaby)
