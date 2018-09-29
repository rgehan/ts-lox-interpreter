import { Lox } from './Lox';
import * as Expr from './Expr';
import * as Stmt from './Stmt';
import { Token } from './Token';
import { TokenType as TT } from './TokenType';
import { Environment } from './Environment';
import { LoxCallable } from './LoxCallable';
import StdLib from './stdlib';
import { LoxFunction } from './LoxFunction';
import { Return } from './Return';

export class Interpreter implements Expr.Visitor<any>, Stmt.Visitor<void> {
  globals: Environment;
  environment: Environment;

  constructor() {
    this.globals = new Environment();
    this.environment = this.globals;

    // Register all the functions from the standard library as globals
    for (const functionName in StdLib) {
      this.globals.define(functionName, StdLib[functionName]);
    }
  }

  interpret(statements: Stmt.Stmt[]) {
    try {
      statements.forEach(statement => {
        this.execute(statement);
      });
    } catch (error) {
      if (error.name === 'RuntimeError') {
        Lox.runtimeError(error);
      } else {
        console.log('Generic error. ', error);
      }
    }
  }

  visitBlockStmt(stmt: Stmt.Block) {
    this.executeBlock(stmt.statements, new Environment(this.environment));
  }

  visitExpressionStmt(stmt: Stmt.Expression) {
    this.evaluate(stmt.expression);
  }

  visitFunctionStmt(stmt: Stmt.Function) {
    const fn: LoxFunction = new LoxFunction(stmt);
    this.environment.define(stmt.name.lexeme, fn);
  }

  visitIfStmt(stmt: Stmt.If) {
    if (this.isTruthy(this.evaluate(stmt.condition))) {
      this.execute(stmt.thenBranch);
    } else if (stmt.elseBranch !== null) {
      this.execute(stmt.elseBranch);
    }
  }

  visitWhileStmt(stmt: Stmt.While) {
    while (this.isTruthy(this.evaluate(stmt.condition))) {
      this.execute(stmt.body);
    }
  }

  visitPrintStmt(stmt: Stmt.Print) {
    const value = this.evaluate(stmt.expression);
    console.log(this.stringify(value));
  }

  visitReturnStmt(stmt: Stmt.Return) {
    let value: any = null;

    if (stmt.value !== null) {
      value = this.evaluate(stmt.value);
    }

    throw new Return(value);
  }

  visitVarStmt(stmt: Stmt.Var) {
    let value: any = null;

    if (stmt.initializer) {
      value = this.evaluate(stmt.initializer);
    }

    this.environment.define(stmt.name.lexeme, value);
  }

  visitAssignExpr(expr: Expr.Assign): any {
    const value = this.evaluate(expr.value);

    this.environment.assign(expr.name, value);
    return value;
  }

  visitGroupingExpr(expr: Expr.Grouping): any {
    return this.evaluate(expr.expression);
  }

  visitLiteralExpr(expr: Expr.Literal): any {
    return expr.value;
  }

  visitUnaryExpr(expr: Expr.Unary): any {
    const right: any = this.evaluate(expr.right);

    switch (expr.operator.type) {
      case TT.MINUS:
        this.checkNumberOperand(expr.operator, right);
        return -Number(right);
      case TT.BANG:
        return !this.isTruthy(right);
    }

    return null;
  }

  visitBinaryExpr(expr: Expr.Binary): any {
    const left: any = this.evaluate(expr.left);
    const right: any = this.evaluate(expr.right);

    switch (expr.operator.type) {
      case TT.GREATER:
        this.checkNumberOperands(expr.operator, left, right);
        return Number(left) > Number(right);
      case TT.GREATER_EQUAL:
        this.checkNumberOperands(expr.operator, left, right);
        return Number(left) >= Number(right);
      case TT.LESS:
        this.checkNumberOperands(expr.operator, left, right);
        return Number(left) < Number(right);
      case TT.LESS_EQUAL:
        this.checkNumberOperands(expr.operator, left, right);
        return Number(left) <= Number(right);
      case TT.EQUAL_EQUAL:
        return left === right;
      case TT.BANG_EQUAL:
        return left !== right;
      case TT.SLASH:
        this.checkNumberOperands(expr.operator, left, right);

        if (right === 0) {
          throw new RuntimeError(expr.operator, 'Cannot divide by zero.');
        }

        return Number(left) / Number(right);

      case TT.STAR:
        this.checkNumberOperands(expr.operator, left, right);
        return Number(left) * Number(right);
      case TT.MINUS:
        this.checkNumberOperands(expr.operator, left, right);
        return Number(left) - Number(right);
      case TT.PERCENT:
        this.checkNumberOperands(expr.operator, left, right);
        return Number(left) % Number(right);
      case TT.HAT:
        this.checkNumberOperands(expr.operator, left, right);
        return Number(left) ** Number(right);
      case TT.PLUS:
        if (typeof left === 'string' || typeof right === 'string') {
          return `${left}${right}`;
        }

        if (typeof left === 'number' && typeof right === 'number') {
          return Number(left) + Number(right);
        }

        throw new RuntimeError(
          expr.operator,
          'Operands must be two numbers or two strings'
        );
      case TT.COMMA:
        return right;
    }
  }

  visitCallExpr(expr: Expr.Call): any {
    const callee = this.evaluate(expr.callee);

    // Throw if the "callee" is not callable
    if (!(callee instanceof LoxCallable)) {
      throw new RuntimeError(
        expr.paren,
        'Can only call functions and classes.'
      );
    }

    // Extract the arguments of the call
    const args: any[] = [];
    for (const arg of expr.args) {
      args.push(this.evaluate(arg));
    }

    const fn: LoxCallable = callee as LoxCallable;

    // Check the number of arguments is compatible with the function's arity
    if (args.length !== fn.arity()) {
      throw new RuntimeError(
        expr.paren,
        `Expected ${fn.arity()} arguments, but got ${args.length}.`
      );
    }

    return fn.call(this, args);
  }

  visitLogicalExpr(expr: Expr.Logical): any {
    const left = this.evaluate(expr.left);

    switch (expr.operator.type) {
      case TT.OR:
        if (this.isTruthy(left)) return left;
      case TT.AND:
        if (!this.isTruthy(left)) return left;
      default:
        return this.evaluate(expr.right);
    }
  }

  visitVariableExpr(expr: Expr.Variable): any {
    return this.environment.get(expr.name);
  }

  private checkNumberOperand(operator: Token, operand: any) {
    if (typeof operand === 'number') {
      return;
    }

    throw new RuntimeError(operator, 'Operand must be a number');
  }

  private checkNumberOperands(operator: Token, left: any, right: any) {
    if (typeof left === 'number' && typeof right === 'number') {
      return;
    }

    throw new RuntimeError(operator, 'Operands must be numbers');
  }

  private isTruthy(object: any): boolean {
    return (
      object !== null &&
      object !== undefined &&
      object !== false &&
      object !== 0
    );
  }

  private evaluate(expr: Expr.Expr): any {
    return expr.accept(this);
  }

  private execute(stmt: Stmt.Stmt): void {
    return stmt.accept(this);
  }

  executeBlock(statements: Stmt.Stmt[], environment: Environment) {
    const previous: Environment = this.environment;

    try {
      this.environment = environment;
      statements.forEach(statement => this.execute(statement));
    } finally {
      this.environment = previous;
    }
  }

  private stringify(object: any): string {
    if (object === null) {
      return 'nil';
    }

    return object.toString();
  }
}

export class RuntimeError extends Error {
  token: Token;

  constructor(token: Token, message: string) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);

    this.token = token;
  }
}
