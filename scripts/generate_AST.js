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
    'Function: Token keyword, Token name, Token[] params, Stmt.Stmt[] body',
    'Literal:  Object value',
    'Logical:  Expr left, Token operator, Expr right',
    'Unary:    Token operator, Expr right',
    'Variable: Token name',
  ],
  [`import { Token } from './Token';`, `import * as Stmt from './Stmt';`]
);

defineAST(
  'Stmt',
  [
    'Block:      Stmt[] statements',
    'Class:      Token name, Function[] methods',
    'Break:      Token keyword',
    'Continue:   Token keyword',
    'Expression: Expr.Expr expression',
    'Function:   Expr.Function expression',
    'If:         Expr.Expr condition, Stmt thenBranch, Stmt elseBranch',
    'While:      Expr.Expr condition, Stmt body',
    'Print:      Expr.Expr expression',
    'Return:     Token keyword, Expr.Expr value',
    'Var:        Token name, Expr.Expr initializer',
  ],
  [`import * as Expr from './Expr';`, `import { Token } from './Token';`]
);

function defineAST(baseName, types, imports) {
  const filepath = path.resolve(__dirname, `../src/${baseName}.ts`);

  let content = `
${imports.join('\n')}

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
