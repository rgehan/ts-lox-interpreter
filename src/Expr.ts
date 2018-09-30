import { Token } from './Token';
import * as Stmt from './Stmt';

export interface Visitor<T> {
  visitAssignExpr(expr: Assign): T;
  visitBinaryExpr(expr: Binary): T;
  visitCallExpr(expr: Call): T;
  visitGetExpr(expr: Get): T;
  visitGroupingExpr(expr: Grouping): T;
  visitFunctionExpr(expr: Function): T;
  visitLiteralExpr(expr: Literal): T;
  visitLogicalExpr(expr: Logical): T;
  visitSetExpr(expr: Set): T;
  visitUnaryExpr(expr: Unary): T;
  visitVariableExpr(expr: Variable): T;
}

export abstract class Expr {
  abstract accept<T>(visitor: Visitor<T>): T;
}

export class Assign extends Expr {
  name: Token;
  value: Expr;

  constructor(name: Token, value: Expr) {
    super();
    this.name = name;
    this.value = value;
  }

  accept<T>(visitor: Visitor<T>): T {
    return visitor.visitAssignExpr(this);
  }
}

export class Binary extends Expr {
  left: Expr;
  operator: Token;
  right: Expr;

  constructor(left: Expr, operator: Token, right: Expr) {
    super();
    this.left = left;
    this.operator = operator;
    this.right = right;
  }

  accept<T>(visitor: Visitor<T>): T {
    return visitor.visitBinaryExpr(this);
  }
}

export class Call extends Expr {
  callee: Expr;
  paren: Token;
  args: Expr[];

  constructor(callee: Expr, paren: Token, args: Expr[]) {
    super();
    this.callee = callee;
    this.paren = paren;
    this.args = args;
  }

  accept<T>(visitor: Visitor<T>): T {
    return visitor.visitCallExpr(this);
  }
}

export class Get extends Expr {
  object: Expr;
  name: Token;

  constructor(object: Expr, name: Token) {
    super();
    this.object = object;
    this.name = name;
  }

  accept<T>(visitor: Visitor<T>): T {
    return visitor.visitGetExpr(this);
  }
}

export class Grouping extends Expr {
  expression: Expr;

  constructor(expression: Expr) {
    super();
    this.expression = expression;
  }

  accept<T>(visitor: Visitor<T>): T {
    return visitor.visitGroupingExpr(this);
  }
}

export class Function extends Expr {
  keyword: Token;
  name: Token;
  params: Token[];
  body: Stmt.Stmt[];

  constructor(keyword: Token, name: Token, params: Token[], body: Stmt.Stmt[]) {
    super();
    this.keyword = keyword;
    this.name = name;
    this.params = params;
    this.body = body;
  }

  accept<T>(visitor: Visitor<T>): T {
    return visitor.visitFunctionExpr(this);
  }
}

export class Literal extends Expr {
  value: Object;

  constructor(value: Object) {
    super();
    this.value = value;
  }

  accept<T>(visitor: Visitor<T>): T {
    return visitor.visitLiteralExpr(this);
  }
}

export class Logical extends Expr {
  left: Expr;
  operator: Token;
  right: Expr;

  constructor(left: Expr, operator: Token, right: Expr) {
    super();
    this.left = left;
    this.operator = operator;
    this.right = right;
  }

  accept<T>(visitor: Visitor<T>): T {
    return visitor.visitLogicalExpr(this);
  }
}

export class Set extends Expr {
  object: Expr;
  name: Token;
  value: Expr;

  constructor(object: Expr, name: Token, value: Expr) {
    super();
    this.object = object;
    this.name = name;
    this.value = value;
  }

  accept<T>(visitor: Visitor<T>): T {
    return visitor.visitSetExpr(this);
  }
}

export class Unary extends Expr {
  operator: Token;
  right: Expr;

  constructor(operator: Token, right: Expr) {
    super();
    this.operator = operator;
    this.right = right;
  }

  accept<T>(visitor: Visitor<T>): T {
    return visitor.visitUnaryExpr(this);
  }
}

export class Variable extends Expr {
  name: Token;

  constructor(name: Token) {
    super();
    this.name = name;
  }

  accept<T>(visitor: Visitor<T>): T {
    return visitor.visitVariableExpr(this);
  }
}
