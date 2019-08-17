import {
  chain,
  Rule,
  SchematicContext,
  Tree,
  url
} from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';

const devDependencies = [
  {
    name: 'wallaby-webpack',
    version: '*'
  }
];

/**
 * Schematics options
 */
export interface NgAddOptions {}

interface ProjectList {
  apps: string[];
  libs: string[];
}

export default function(_options: NgAddOptions): Rule {
  return (tree: Tree, context: SchematicContext) => {
    return chain([
      chain([addConfigFile()]),
      addLoadersToPackageJson(),
      addPackageInstallTask()
    ])(tree, context);
  };
}

function addConfigFile(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const wallabyConfigSourceFileName = '/wallaby.js';
    const wallabyConfigFileName = '/wallaby.js';

    const files: Tree = url(`../../files`)(context) as Tree;
    const createContent = files
      .read(wallabyConfigSourceFileName)!
      .toString('utf-8');

    if (!tree.exists(wallabyConfigFileName)) {
      tree.create(wallabyConfigFileName, createContent);
    }

    return tree;
  };
}

function addLoadersToPackageJson(): Rule {
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
