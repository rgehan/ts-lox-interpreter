import { Lox } from './Lox';
import * as Expr from './Expr';
import { Token } from './Token';
import { TokenType as TT } from './TokenType';

export class Interpreter implements Expr.Visitor<any> {
  interpret(expression: Expr.Expr) {
    try {
      const value = this.evaluate(expression);
      console.log(this.stringify(value));
    } catch (error) {
      Lox.runtimeError(error);
    }
  }

  private evaluate(expr: Expr.Expr): any {
    return expr.accept(this);
  }

  private stringify(object: any): string {
    if (object === null) {
      return 'nil';
    }

    return object.toString();
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
        return Number(left) / Number(right);
      case TT.STAR:
        this.checkNumberOperands(expr.operator, left, right);
        return Number(left) * Number(right);
      case TT.MINUS:
        this.checkNumberOperands(expr.operator, left, right);
        return Number(left) - Number(right);
      case TT.PLUS:
        if (typeof left === 'string' && typeof right === 'string') {
          return `${left}${right}`;
        }

        if (typeof left === 'number' && typeof right === 'number') {
          return Number(left) + Number(right);
        }

        throw new RuntimeError(
          expr.operator,
          'Operands must be two numbers or two strings'
        );
    }
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
