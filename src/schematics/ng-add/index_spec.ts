import { getFileContent } from '@schematics/angular/utility/test';
import {
  SchematicTestRunner,
  UnitTestTree
} from '@angular-devkit/schematics/testing';
import * as path from 'path';
import { createTestApp } from '../../utils/testing';

const collectionPath = path.join(__dirname, '../collection.json');

describe('ng-cli-wallaby-config', () => {
  let appTree: UnitTestTree;
  let runner: SchematicTestRunner;

  beforeEach(() => {
    appTree = createTestApp();
    runner = new SchematicTestRunner('schematics', collectionPath);
  });

  it('it should create wallaby.js file', () => {
    const tree = runner.runSchematic('ng-add', {}, appTree);
    expect(tree.read('/wallaby.js')).toBeDefined();
  });

  it('it should create wallabyTest.ts file', () => {
    const tree = runner.runSchematic('ng-add', {}, appTree);
    expect(tree.read('/src/wallabyTest.ts')).toBeDefined();
  });

  it('it should add devDependence in package.json', () => {
    const tree = runner.runSchematic('ng-add', {}, appTree);
    const packageJson = JSON.parse(getFileContent(tree, '/package.json'));
    expect(packageJson.devDependencies['wallaby-webpack']).toBeDefined();
    expect(
      packageJson.devDependencies['angular2-template-loader']
    ).toBeDefined();
  });

  it('it should update tsconfig.app.json file', () => {
    const tree = runner.runSchematic('ng-add', {}, appTree);
    const tsconfigJson = JSON.parse(
      getFileContent(tree, '/src/tsconfig.app.json')
    );
    expect(tsconfigJson.exclude).toContain('wallabyTest.ts');
  });
});
