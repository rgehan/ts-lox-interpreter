import * as Expr from './Expr';

export class AstPrinter implements Expr.Visitor<string> {
  print(expr: Expr.Expr): string {
    return expr.accept(this);
  }

  visitAssignExpr(expr: Expr.Assign): string {
    return ''; // TODO
  }

  visitBinaryExpr(expr: Expr.Binary): string {
    return this.parenthesize(expr.operator.lexeme, expr.left, expr.right);
  }

  visitGroupingExpr(expr: Expr.Grouping): string {
    return this.parenthesize('group', expr.expression);
  }

  visitLiteralExpr(expr: Expr.Literal): string {
    if (expr.value === null) {
      return 'nil';
    }

    return expr.value.toString();
  }

  visitUnaryExpr(expr: Expr.Unary): string {
    return this.parenthesize(expr.operator.lexeme, expr.right);
  }

  visitVariableExpr(expr: Expr.Variable): string {
    return expr.name.lexeme; // TODO
  }

  private parenthesize(name: string, ...exprs: Expr.Expr[]): string {
    const exprStrings = exprs.map(expr => ' ' + expr.accept(this));
    return `(${name}${exprStrings})`;
  }
}
