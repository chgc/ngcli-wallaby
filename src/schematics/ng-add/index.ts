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
    const wallabyConfigFileName = 'wallaby.js';
    const files: Tree = url(`../../files`)(context) as Tree;
    const scriptContent = files.read(wallabyConfigFileName)!.toString('utf-8');
    if (!tree.exists(wallabyConfigFileName)) {
      tree.create(wallabyConfigFileName, scriptContent);
    }
  };
}

function addBootstrapFile() {
  return (tree: Tree, context: SchematicContext) => {
    const wallabyBootstrapFileName = 'src/wallabyTest.ts';
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
    const tsConfigSource = tree.read('tsconfig.json')!.toString('utf-8');
    const json = JSON.parse(tsConfigSource);
    if (json['exclude']) {
      if (!(json['exclude'] as any[]).includes('wallabyTest.ts')) {
        json['exclude'].push('wallabyTest.ts');
      }
    }
    tree.overwrite('tsconfig.json', JSON.stringify(json, null, 2));
  };
}

/**
 * Inserts `apply-loader` and `pug-loader` packages into
 * application's package.json
 */
function addLoadersToPackageJson() {
  return (host: Tree) => {
    devDependencies.forEach(dependency => {
      addDependencyToPackageJson(
        host,
        'devDependencies',
        dependency.name,
        dependency.version
      );
    });
    return host;
  };
}

/**
 * Tell schematics engine that we need a package install after done
 */
function addPackageInstallTask() {
  return (_host: Tree, context: SchematicContext) => {
    const depNames = devDependencies.map(d => d.name).join(' ');
    context.addTask(
      new NodePackageInstallTask({
        packageName: depNames
      })
    );
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
  host: Tree,
  type: DependencyTypes,
  pkg: string,
  version: string = 'latest'
): Tree {
  if (host.exists('package.json')) {
    const sourceText = host.read('package.json')!.toString('utf-8');
    const json = JSON.parse(sourceText);
    if (!json[type]) {
      json[type] = {};
    }

    if (!json[type][pkg]) {
      json[type][pkg] = version;
    }

    host.overwrite('package.json', JSON.stringify(json, null, 2));
  }

  return host;
}
