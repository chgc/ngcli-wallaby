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

# Reference

[ngCliWebpackSample](https://github.com/wallabyjs/ngCliWebpackSample)
