import { Expr } from './Expr';
import { Token } from './Token';

export interface Visitor<T> {
  visitBlockStmt(stmt: Block): T;
  visitBreakStmt(stmt: Break): T;
  visitExpressionStmt(stmt: Expression): T;
  visitFunctionStmt(stmt: Function): T;
  visitIfStmt(stmt: If): T;
  visitWhileStmt(stmt: While): T;
  visitPrintStmt(stmt: Print): T;
  visitReturnStmt(stmt: Return): T;
  visitVarStmt(stmt: Var): T;
}

export abstract class Stmt {
  abstract accept<T>(visitor: Visitor<T>): T;
}

export class Block extends Stmt {
  statements: Stmt[];

  constructor(statements: Stmt[]) {
    super();
    this.statements = statements;
  }

  accept<T>(visitor: Visitor<T>): T {
    return visitor.visitBlockStmt(this);
  }
}

export class Break extends Stmt {
  keyword: Token;

  constructor(keyword: Token) {
    super();
    this.keyword = keyword;
  }

  accept<T>(visitor: Visitor<T>): T {
    return visitor.visitBreakStmt(this);
  }
}

export class Expression extends Stmt {
  expression: Expr;

  constructor(expression: Expr) {
    super();
    this.expression = expression;
  }

  accept<T>(visitor: Visitor<T>): T {
    return visitor.visitExpressionStmt(this);
  }
}

export class Function extends Stmt {
  name: Token;
  params: Token[];
  body: Stmt[];

  constructor(name: Token, params: Token[], body: Stmt[]) {
    super();
    this.name = name;
    this.params = params;
    this.body = body;
  }

  accept<T>(visitor: Visitor<T>): T {
    return visitor.visitFunctionStmt(this);
  }
}

export class If extends Stmt {
  condition: Expr;
  thenBranch: Stmt;
  elseBranch: Stmt;

  constructor(condition: Expr, thenBranch: Stmt, elseBranch: Stmt) {
    super();
    this.condition = condition;
    this.thenBranch = thenBranch;
    this.elseBranch = elseBranch;
  }

  accept<T>(visitor: Visitor<T>): T {
    return visitor.visitIfStmt(this);
  }
}

export class While extends Stmt {
  condition: Expr;
  body: Stmt;

  constructor(condition: Expr, body: Stmt) {
    super();
    this.condition = condition;
    this.body = body;
  }

  accept<T>(visitor: Visitor<T>): T {
    return visitor.visitWhileStmt(this);
  }
}

export class Print extends Stmt {
  expression: Expr;

  constructor(expression: Expr) {
    super();
    this.expression = expression;
  }

  accept<T>(visitor: Visitor<T>): T {
    return visitor.visitPrintStmt(this);
  }
}

export class Return extends Stmt {
  keyword: Token;
  value: Expr;

  constructor(keyword: Token, value: Expr) {
    super();
    this.keyword = keyword;
    this.value = value;
  }

  accept<T>(visitor: Visitor<T>): T {
    return visitor.visitReturnStmt(this);
  }
}

export class Var extends Stmt {
  name: Token;
  initializer: Expr;

  constructor(name: Token, initializer: Expr) {
    super();
    this.name = name;
    this.initializer = initializer;
  }

  accept<T>(visitor: Visitor<T>): T {
    return visitor.visitVarStmt(this);
  }
}
