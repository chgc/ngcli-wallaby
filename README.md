# Requirement

- Angular CLI Version 8+

# Getting Started With ngcli-wallaby Schematics

This schematics will let you setup wallaby.js testing environment by simply run following command.

```
ng add ngcli-wallaby
```

After running `ng add ngcli-wallaby` command, it will do following things.

- Add the wallaby.js config file to the project.
- Run npm install wallaby-webpack --save-dev.

In default setup, it uses [Chrome (headless) runner](https://wallabyjs.com/docs/integration/chrome.html) as default runner instead electron. If you want to use electron, you can manually change it back by changing the env setting to env: {kind: 'electron'}, and run `npm i electron`

In this version, it only works on simple angular project. If you are using multi projects structure, this schematics will not work. Please be attantion to that.

# Nrwl Nx project

Removed (2019/8/17)

# Credit

Thanks to [TomWhiteOmni](https://github.com/TomWhiteOmni).

# Reference

- [ngCliWebpackSample](https://github.com/wallabyjs/ngCliWebpackSample)
- ~~[angular-nx-wallaby](https://github.com/TomWhiteOmni/angular-nx-wallaby)~~
