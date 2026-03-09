import { Project } from 'ts-morph';
import {
  clearTypeCache,
  initParseOptions,
  parseTypeInfo,
} from './src/core/typeParser';

const project = new Project({
  useInMemoryFileSystem: true,
  compilerOptions: {
    strict: true,
    target: 99,
  },
});

project.createSourceFile(
  'test.ts',
  `
  export interface TupleTypes {
    namedTuple: [x: number, y: number, z: number];
  }
  `,
);

clearTypeCache();
initParseOptions({});

const sourceFile = project.getSourceFile('test.ts');
const iface = sourceFile?.getInterface('TupleTypes');
const prop = iface?.getProperty('namedTuple');
const propType = prop?.getType();

console.log('Property type text:', propType?.getText());
console.log('isArray:', propType?.isArray());
console.log('isObject:', propType?.isObject());

// 检查别名
const aliasSymbol = propType?.getAliasSymbol();
console.log('Has alias symbol:', !!aliasSymbol);
if (aliasSymbol) {
  const decls = aliasSymbol.getDeclarations();
  console.log('Declarations:', decls.length);
  if (decls[0]) {
    console.log('Declaration text:', decls[0].getText());
  }
}

const typeInfo = parseTypeInfo(propType!);
console.log('\\nParsed kind:', 'kind' in typeInfo ? typeInfo.kind : 'ref');
console.log('Parsed text:', 'text' in typeInfo ? typeInfo.text : typeInfo.$ref);
