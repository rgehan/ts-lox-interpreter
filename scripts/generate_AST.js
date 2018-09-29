#! /usr/bin/env node

const path = require('path');
const fs = require('fs');
const { chain } = require('lodash');

defineAST(
  'Expr',
  [
    'Assign:   Token name, Expr value',
    'Binary:   Expr left, Token operator, Expr right',
    'Call:     Expr callee, Token paren, Expr[] args',
    'Grouping: Expr expression',
    'Literal:  Object value',
    'Logical:  Expr left, Token operator, Expr right',
    'Unary:    Token operator, Expr right',
    'Variable: Token name',
  ],
  ['Token']
);

defineAST(
  'Stmt',
  [
    'Block:      Stmt[] statements',
    'Expression: Expr expression',
    'If:         Expr condition, Stmt thenBranch, Stmt elseBranch',
    'While:      Expr condition, Stmt body',
    'Print:      Expr expression',
    'Var:        Token name, Expr initializer',
  ],
  ['Expr', 'Token']
);

function defineAST(baseName, types, imports) {
  const filepath = path.resolve(__dirname, `../src/${baseName}.ts`);

  let content = `
${imports
    .map(importName => `import { ${importName} } from './${importName}';`)
    .join('\n')}

${defineVisitor(baseName, types)}

export abstract class ${baseName} {
  abstract accept<T>(visitor: Visitor<T>): T;
}`;

  content = content.trim() + '\n\n';

  // Create all expressions classes
  types.forEach(type => {
    const className = type.split(':')[0].trim();
    const fields = type.split(':')[1].trim();

    content += defineType(baseName, className, fields) + '\n\n';
  });

  fs.writeFileSync(filepath, content.trim() + '\n');
}

function defineVisitor(baseName, types) {
  const visitorMethods = chain(types)
    .map(type => type.split(':')[0].trim())
    .map(
      typeName =>
        `visit${typeName}${baseName}(${baseName.toLowerCase()}: ${typeName}): T;`
    )
    .join('\n  ')
    .value();

  const content = `
export interface Visitor<T> {
  ${visitorMethods}
}`;

  return content.trim();
}

function defineType(baseName, className, fields) {
  const parsedFields = chain(fields)
    .trim()
    .split(',')
    .map(field => {
      const [type, name] = field.trim().split(' ');
      return [name, type];
    })
    .value();

  const classFields = chain(parsedFields)
    .map(([name, type]) => `${name}: ${type};`)
    .join('\n  ')
    .value();

  const ctorParams = chain(parsedFields)
    .map(pair => pair.join(': '))
    .join(', ')
    .value();

  const ctorAssignments = chain(parsedFields)
    .map(([name]) => `this.${name} = ${name};`)
    .join('\n    ')
    .value();

  const content = `
export class ${className} extends ${baseName} {
  ${classFields}

  constructor(${ctorParams}) {
    super();
    ${ctorAssignments}
  }

  accept<T>(visitor: Visitor<T>): T {
    return visitor.visit${className}${baseName}(this);
  }
}`;

  return content.trim();
}
