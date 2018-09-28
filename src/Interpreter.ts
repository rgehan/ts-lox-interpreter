import * as Expr from './Expr';
import { TokenType as TT } from './TokenType';

export class Interpreter implements Expr.Visitor<any> {
  evaluate(expr: Expr.Expr): any {
    return expr.accept(this);
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
        return Number(left) > Number(right);
      case TT.GREATER_EQUAL:
        return Number(left) >= Number(right);
      case TT.LESS:
        return Number(left) < Number(right);
      case TT.LESS_EQUAL:
        return Number(left) <= Number(right);
      case TT.EQUAL_EQUAL:
        return left === right;
      case TT.BANG_EQUAL:
        return left !== right;
      case TT.SLASH:
        return Number(left) / Number(right);
      case TT.STAR:
        return Number(left) * Number(right);
      case TT.MINUS:
        return Number(left) - Number(right);
      case TT.PLUS:
        if (typeof left === 'string' && typeof right === 'string') {
          return `${left}${right}`;
        }

        if (typeof left === 'number' && typeof right === 'number') {
          return Number(left) + Number(right);
        }
    }
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
