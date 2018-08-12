import {
  chain,
  Rule,
  SchematicContext,
  Tree,
  url,
  SchematicsException
} from '@angular-devkit/schematics';
import { template as interpolateTemplate } from '@angular-devkit/core';
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

interface ProjectList {
  apps: string[];
  libs: string[];
}

export default function(_options: NgAddOptions): Rule {
  return chain([
    addConfigFile(),
    addBootstrapFile(),
    modifyTsconfigExcludeFile(),
    addLoadersToPackageJson(),
    addPackageInstallTask()
  ]);
}

function addConfigFile(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const nx = containNxScematics(tree);
    let importCompilerOptions, importAlias;
    const wallabyConfigSourceFileName = nx ? '/nx/wallaby.js' : '/wallaby.js';
    const wallabyConfigFileName = '/wallaby.js';

    if (nx) {
      importCompilerOptions = createCompilerOptions(getProjectLibs(tree));
      importAlias = createAlias(tree);
    } else {
      importCompilerOptions = '';
      importAlias = '';
    }
    const files: Tree = url(`../../files`)(context) as Tree;
    const scriptContent = files
      .read(wallabyConfigSourceFileName)!
      .toString('utf-8');

    let createContent = interpolateTemplate(scriptContent)({
      importCompilerOptions,
      importAlias
    });
    if (!tree.exists(wallabyConfigFileName)) {
      tree.create(wallabyConfigFileName, createContent);
    }

    return tree;
  };
}

function addBootstrapFile() {
  return (tree: Tree, context: SchematicContext) => {
    const nx = containNxScematics(tree);
    const wallabyBootstrapSourceFileName = nx
      ? '/nx/wallabyTest.ts'
      : '/src/wallabyTest.ts';
    const wallabyBootstrapFileName = nx
      ? '/wallabyTest.ts'
      : '/src/wallabyTest.ts';
    const files: Tree = url(`../../files`)(context) as Tree;
    const scriptContent = files
      .read(wallabyBootstrapSourceFileName)!
      .toString('utf-8');
    if (!tree.exists(wallabyBootstrapFileName)) {
      tree.create(wallabyBootstrapFileName, scriptContent);
    }
    return tree;
  };
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
  let projects = { apps: [] as string[], libs: [] as string[] };
  for (let project in packageJson.projects) {
    if (project.includes('-e2e')) {
      continue;
    }
    let projectInfo = packageJson.projects[project];
    if (projectInfo.projectType === 'application') {
      projects.apps.push(project);
    }
    if (projectInfo.projectType === 'library') {
      projects.libs.push(project);
    }
  }
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
  let alias: any[] = [];
  for (let path in tsconfig.compilerOptions.paths) {
    if (!path.includes('*')) {
      let value = tsconfig.compilerOptions.paths[path];
      alias.push(`'${path}': path.join(wallaby.projectCacheDir, '${value}' )`);
    }
  }

  if (alias.length === 0) {
    return '';
  }
  return `alias: {
    ${alias.join(',')}
  }`;
}
