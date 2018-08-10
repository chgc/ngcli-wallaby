import {
  UnitTestTree,
  SchematicTestRunner
} from '@angular-devkit/schematics/testing';
import { join } from 'path';

const workspaceOptions = {
  name: 'workspace',
  newProjectRoot: 'projects',
  version: '6.0.0'
};

const appOptions = {
  projectRoot: '',
  name: 'bar',
  inlineStyle: false,
  inlineTemplate: false,
  routing: false,
  style: 'css',
  skipTests: false,
  skipPackageJson: false
};

let appTree: UnitTestTree;
const collectionPath = join(
  './node_modules/@schematics/angular/collection.json'
);
export function createTestApp(): UnitTestTree {
  const schematicRunner = new SchematicTestRunner(
    '@schematics/angular',
    collectionPath
  );
  appTree = schematicRunner.runSchematic('workspace', workspaceOptions);
  appTree = schematicRunner.runSchematic('application', appOptions, appTree);
  return appTree;
}
