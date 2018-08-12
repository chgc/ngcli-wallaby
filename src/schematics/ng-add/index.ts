import {
  chain,
  Rule,
  SchematicContext,
  Tree,
  url,
  apply,
  move,
  SchematicsException,
  template,
  mergeWith,
  branchAndMerge,
  filter
} from '@angular-devkit/schematics';

import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';
import { hostname } from 'os';

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

interface ProjectList {
  apps: string[];
  libs: string[];
}

export default function ngAdd(_options: NgAddOptions): Rule {
  return (tree: Tree, context: SchematicContext) => {
    return chain([
      addConfigFile(tree),
      addBootstrapFile(tree),
      modifyTsconfigExcludeFile(),
      addLoadersToPackageJson(),
      addPackageInstallTask()
    ])(tree, context);
  };
}

function addConfigFile(tree: Tree): Rule {
  const nx = containNxScematics(tree);
  let importCompilerOptions, importAlias;
  const wallabyConfigFileName = nx ? 'nx' : '';
  const wallabyConfigSourceFileName = nx ? '/nx/wallaby.js' : '/wallaby.js';

  if (nx) {
    importCompilerOptions = createCompilerOptions(getProjectLibs(tree));
    importAlias = createAlias(tree);
  } else {
    importCompilerOptions = '';
    importAlias = '';
  }
  const templateSource = apply(url(`../../files`), [
    filter(path => path === wallabyConfigSourceFileName),
    template({
      importCompilerOptions,
      importAlias
    }),
    move(wallabyConfigFileName, '/')
  ]);
  return chain([branchAndMerge(mergeWith(templateSource))]);
}

function addBootstrapFile(tree: Tree) {
  const nx = containNxScematics(tree);
  const wallabyBootstrapSourceFileName = nx
    ? '/nx/wallabyTest.ts'
    : '/src/wallabyTest.ts';
  const wallabyBootstrapFileName = nx ? 'nx' : '';
  const templateSource = apply(url(`../../files`), [
    filter(path => path === wallabyBootstrapSourceFileName),
    move(wallabyBootstrapFileName, '')
  ]);
  return chain([branchAndMerge(mergeWith(templateSource))]);
}

function modifyTsconfigExcludeFile(): Rule {
  return (tree: Tree) => {
    const nx = containNxScematics(tree);
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
    } else if (nx) {
    } else {
      throw new SchematicsException(`Could not find tsconfig.app.json.`);
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

function containNxScematics(tree: Tree): boolean {
  const sourceText = tree.read('/package.json')!.toString('utf-8');
  const packageJson = JSON.parse(sourceText);
  return !!packageJson.dependencies['@nrwl/nx'];
}

function getProjectLibs(tree: Tree): ProjectList {
  const sourceText = tree.read('/angular.json')!.toString('utf-8');
  const packageJson = JSON.parse(sourceText);
  const projects = Object.entries(packageJson.projects).reduce(
    (acc: any, current: any) => {
      let [key, value] = current;
      if (key.includes('-e2e')) {
        return acc;
      }
      if (value.projectType === 'application') {
        acc.apps.push(key);
      }
      if (value.projectType === 'library') {
        acc.libs.push(key);
      }
      return acc;
    },
    {
      apps: [],
      libs: []
    }
  );
  return projects;
}

function createCompilerOptions(defaultProject: ProjectList): string {
  let compilerOptions: string[] = [];
  compilerOptions = [
    ...compilerOptions,
    ...defaultProject.apps.map(
      (app: string) =>
        `require('./apps/${app}/tsconfig.spec.json').compilerOptions`
    )
  ];
  compilerOptions = [
    ...compilerOptions,
    ...defaultProject.libs.map(
      (lib: string) =>
        `require('./libs/${lib}/tsconfig.spec.json').compilerOptions`
    )
  ];
  return compilerOptions.join(',');
}

function createAlias(tree: Tree): string {
  const sourceText = tree.read('/tsconfig.json')!.toString('utf-8');
  const tsconfig = JSON.parse(sourceText);
  const alias: any[] = Object.entries(tsconfig.compilerOptions.paths).reduce(
    (acc: any, current) => {
      let [key, value] = current;
      if (!key.includes('*')) {
        return [
          ...acc,
          `'${key}': path.join(wallaby.projectCacheDir, '${value}' )`
        ];
      } else {
        return acc;
      }
    },
    []
  );
  if (alias.length === 0) {
    return '';
  }
  return `alias: {
    ${alias.join(',')}
  }`;
}
