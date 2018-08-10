import {
  chain,
  Rule,
  SchematicContext,
  Tree,
  url,
  SchematicsException
} from '@angular-devkit/schematics';

import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';

const devDependencies = [
  {
    name: 'wallaby-webpack',
    version: '*'
  },
  {
    name: 'angular2-template-loader',
    version: '^0.6.2'
  }
];

/**
 * Schematics options
 */
export interface NgAddOptions {}

export default function ngAdd(_options: NgAddOptions): Rule {
  return chain([
    addConfigFile(),
    addBootstrapFile(),
    modifyTsconfigExcludeFile(),
    addLoadersToPackageJson(),
    addPackageInstallTask()
  ]);
}

function addConfigFile() {
  return (tree: Tree, context: SchematicContext) => {
    const wallabyConfigFileName = '/wallaby.js';
    const files: Tree = url(`../../files`)(context) as Tree;
    const scriptContent = files.read(wallabyConfigFileName)!.toString('utf-8');
    if (!tree.exists(wallabyConfigFileName)) {
      tree.create(wallabyConfigFileName, scriptContent);
    }
  };
}

function addBootstrapFile() {
  return (tree: Tree, context: SchematicContext) => {
    const wallabyBootstrapFileName = '/src/wallabyTest.ts';
    const files: Tree = url(`../../files`)(context) as Tree;
    const scriptContent = files
      .read(wallabyBootstrapFileName)!
      .toString('utf-8');
    if (!tree.exists(wallabyBootstrapFileName)) {
      tree.create(wallabyBootstrapFileName, scriptContent);
    }
  };
}

function modifyTsconfigExcludeFile() {
  return (tree: Tree) => {
    if (tree.exists('/src/tsconfig.app.json')) {
      const tsConfigSource = tree
        .read('/src/tsconfig.app.json')!
        .toString('utf-8');
      const json = JSON.parse(tsConfigSource);
      if (json['exclude']) {
        if (!(json['exclude'] as any[]).includes('wallabyTest.ts')) {
          json['exclude'].push('wallabyTest.ts');
        }
      }
      tree.overwrite('/src/tsconfig.app.json', JSON.stringify(json, null, 2));
    }
  };
}

function addLoadersToPackageJson() {
  return (tree: Tree) => {
    devDependencies.forEach(dependency => {
      addDependencyToPackageJson(
        tree,
        'devDependencies',
        dependency.name,
        dependency.version
      );
    });
    return tree;
  };
}

function addPackageInstallTask() {
  return (tree: Tree, context: SchematicContext) => {
    const depNames = devDependencies.map(d => d.name).join(' ');
    context.addTask(
      new NodePackageInstallTask({
        packageName: depNames
      })
    );
    return tree;
  };
}

export type DependencyTypes =
  | 'dependencies'
  | 'devDependencies'
  | 'optionalDependencies'
  | 'peerDependencies';

/**
 * Adds a package to the package.json
 */
export function addDependencyToPackageJson(
  tree: Tree,
  type: DependencyTypes,
  pkg: string,
  version: string = 'latest'
): Tree {
  if (tree.exists('/package.json')) {
    const sourceText = tree.read('/package.json')!.toString('utf-8');
    const json = JSON.parse(sourceText);
    if (!json[type]) {
      json[type] = {};
    }

    if (!json[type][pkg]) {
      json[type][pkg] = version;
    }

    tree.overwrite('/package.json', JSON.stringify(json, null, 2));
  }

  return tree;
}
