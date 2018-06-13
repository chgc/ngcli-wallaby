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
    const workspace = getWorkspace(tree);
    const project = getProjectFromWorkspace(workspace);

    const wallabyConfigFileName = 'wallaby.js';
    const files: Tree = url(`../../files`)(context) as Tree;
    const scriptContent = files.read(wallabyConfigFileName)!.toString('utf-8');
    if (!tree.exists(`${project.root}/${wallabyConfigFileName}`)) {
      tree.create(`${project.root}/${wallabyConfigFileName}`, scriptContent);
    }
  };
}

function addBootstrapFile() {
  return (tree: Tree, context: SchematicContext) => {
    const workspace = getWorkspace(tree);
    const project = getProjectFromWorkspace(workspace);

    const wallabyBootstrapFileName = 'src/wallabyTest.ts';
    const files: Tree = url(`../../files`)(context) as Tree;
    const scriptContent = files
      .read(wallabyBootstrapFileName)!
      .toString('utf-8');
    if (!tree.exists(`${project.root}/${wallabyBootstrapFileName}`)) {
      tree.create(`${project.root}/${wallabyBootstrapFileName}`, scriptContent);
    }
  };
}

function modifyTsconfigExcludeFile() {
  return (tree: Tree) => {
    const workspace = getWorkspace(tree);
    const project = getProjectFromWorkspace(workspace);

    if (tree.exists(`${project.root}/src/tsconfig.app.json`)) {
      const tsConfigSource = tree
        .read(`${project.root}/src/tsconfig.app.json`)!
        .toString('utf-8');
      const json = JSON.parse(tsConfigSource);
      if (json['exclude']) {
        if (!(json['exclude'] as any[]).includes('wallabyTest.ts')) {
          json['exclude'].push('wallabyTest.ts');
        }
      }
      tree.overwrite(
        `${project.root}/src/tsconfig.app.json`,
        JSON.stringify(json, null, 2)
      );
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
  const workspace = getWorkspace(tree);
  const project = getProjectFromWorkspace(workspace);

  if (tree.exists(`${project.root}/package.json`)) {
    const sourceText = tree
      .read(`${project.root}/package.json`)!
      .toString('utf-8');
    const json = JSON.parse(sourceText);
    if (!json[type]) {
      json[type] = {};
    }

    if (!json[type][pkg]) {
      json[type][pkg] = version;
    }

    tree.overwrite(
      `${project.root}/package.json`,
      JSON.stringify(json, null, 2)
    );
  }

  return tree;
}

export const ANGULAR_CLI_WORKSPACE_PATH = '/angular.json';
/** Gets the Angular CLI workspace config (angular.json) */
export function getWorkspace(host: Tree) {
  const configBuffer = host.read(ANGULAR_CLI_WORKSPACE_PATH);
  if (configBuffer === null) {
    throw new SchematicsException('Could not find angular.json');
  }

  return JSON.parse(configBuffer.toString());
}

/**
 * Gets a project from the Angular CLI workspace. If no project name is given, the first project
 * will be retrieved.
 */
export function getProjectFromWorkspace(config: any, projectName?: string) {
  if (config.projects) {
    if (projectName) {
      const project = config.projects[projectName];
      if (!project) {
        return;
      }

      Object.defineProperty(project, 'name', {
        enumerable: false,
        value: projectName
      });
      return project;
    }

    // If there is exactly one non-e2e project, use that. Otherwise, require that a specific
    // project be specified.
    const allProjectNames = Object.keys(config.projects).filter(
      p => !p.includes('e2e')
    );
    if (allProjectNames.length === 1) {
      const project = config.projects[allProjectNames[0]];
      // Set a non-enumerable project name to the project. We need the name for schematics
      // later on, but don't want to write it back out to the config file.
      Object.defineProperty(project, 'name', {
        enumerable: false,
        value: projectName
      });
      return project;
    } else {
      throw new SchematicsException(
        'Multiple projects are defined; please specify a project name'
      );
    }
  }
}
