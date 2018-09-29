import * as Expr from './Expr';
import * as Stmt from './Stmt';
import { Token } from './Token';
import { Interpreter } from './Interpreter';
import { Lox } from './Lox';

type Scope = Map<string, boolean>;
type Resolveable = Expr.Expr | Stmt.Stmt;
enum FunctionType {
  NONE,
  FUNCTION,
}
enum LoopType {
  NONE,
  LOOP,
}

export class Resolver implements Expr.Visitor<void>, Stmt.Visitor<void> {
  interpreter: Interpreter;
  scopes: Stack<Scope>;
  currentFunction: FunctionType;
  currentLoop: LoopType;

  constructor(interpreter: Interpreter) {
    this.interpreter = interpreter;
    this.scopes = new Stack();
    this.currentFunction = FunctionType.NONE;
    this.currentLoop = LoopType.NONE;
  }

  visitBlockStmt(stmt: Stmt.Block) {
    this.beginScope();
    this.resolve(...stmt.statements);
    this.endScope();
  }

  visitExpressionStmt(stmt: Stmt.Expression) {
    this.resolve(stmt.expression);
  }

  visitVarStmt(stmt: Stmt.Var) {
    this.declare(stmt.name);

    if (stmt.initializer !== null) {
      this.resolve(stmt.initializer);
    }

    this.define(stmt.name);
  }

  visitFunctionStmt(stmt: Stmt.Function) {
    this.declare(stmt.name);
    this.define(stmt.name);

    this.resolveFunction(stmt, FunctionType.FUNCTION);
  }

  visitIfStmt(stmt: Stmt.If) {
    this.resolve(stmt.condition);
    this.resolve(stmt.thenBranch);
    if (stmt.elseBranch) {
      this.resolve(stmt.elseBranch);
    }
  }

  visitPrintStmt(stmt: Stmt.Print) {
    this.resolve(stmt.expression);
  }

  visitReturnStmt(stmt: Stmt.Return) {
    if (this.currentFunction === FunctionType.NONE) {
      Lox.errorAtToken(stmt.keyword, 'Cannot return from top-level code.');
    }

    if (stmt.value) {
      this.resolve(stmt.value);
    }
  }

  visitWhileStmt(stmt: Stmt.While) {
    const enclosingLoop = this.currentLoop;
    this.currentLoop = LoopType.LOOP;

    this.resolve(stmt.condition);
    this.resolve(stmt.body);

    this.currentLoop = enclosingLoop;
  }

  visitBreakStmt(stmt: Stmt.Break) {
    if (this.currentLoop === LoopType.NONE) {
      Lox.errorAtToken(stmt.keyword, 'Cannot use "break" outside of a loop.');
    }
  }

  visitContinueStmt(stmt: Stmt.Continue) {
    if (this.currentLoop === LoopType.NONE) {
      Lox.errorAtToken(
        stmt.keyword,
        'Cannot use "continue" outside of a loop.'
      );
    }
  }

  visitVariableExpr(expr: Expr.Variable) {
    if (
      !this.scopes.isEmpty() &&
      this.scopes.peek().get(expr.name.lexeme) === false
    ) {
      Lox.errorAtToken(
        expr.name,
        'Cannot read local variable in its own initializer'
      );
    }

    this.resolveLocal(expr, expr.name);
  }

  visitAssignExpr(expr: Expr.Assign) {
    this.resolve(expr.value);
    this.resolveLocal(expr, expr.name);
  }

  visitBinaryExpr(expr: Expr.Binary) {
    this.resolve(expr.left);
    this.resolve(expr.right);
  }

  visitCallExpr(expr: Expr.Call) {
    this.resolve(expr.callee);
    this.resolve(...expr.args);
  }

  visitGroupingExpr(expr: Expr.Grouping) {
    this.resolve(expr.expression);
  }

  visitLogicalExpr(expr: Expr.Logical) {
    this.resolve(expr.left);
    this.resolve(expr.right);
  }

  visitUnaryExpr(expr: Expr.Unary) {
    this.resolve(expr.right);
  }

  visitLiteralExpr(expr: Expr.Literal) {}

  resolve(...resolveables: Resolveable[]) {
    for (const resolveable of resolveables) {
      if (resolveable instanceof Expr.Expr) {
        (resolveable as Expr.Expr).accept(this);
      } else if (resolveable instanceof Stmt.Stmt) {
        (resolveable as Stmt.Stmt).accept(this);
      }
    }
  }

  private resolveFunction(fn: Stmt.Function, type: FunctionType) {
    const enclosingFunction = this.currentFunction;
    this.currentFunction = type;

    this.beginScope();
    for (const param of fn.params) {
      this.declare(param);
      this.define(param);
    }
    this.resolve(...fn.body);
    this.endScope();

    this.currentFunction = enclosingFunction;
  }

  private beginScope() {
    this.scopes.push(new Map());
  }

  private endScope() {
    this.scopes.pop();
  }

  private declare(name: Token) {
    if (this.scopes.isEmpty()) {
      return;
    }

    const scope = this.scopes.peek();

    if (scope.has(name.lexeme)) {
      Lox.errorAtToken(
        name,
        'Variable with this name is already declared in this scope.'
      );
    }

    scope.set(name.lexeme, false);
  }

  private define(name: Token) {
    if (this.scopes.isEmpty()) {
      return;
    }

    this.scopes.peek().set(name.lexeme, true);
  }

  private resolveLocal(expr: Expr.Expr, name: Token) {
    for (let i = this.scopes.size() - 1; i >= 0; i--) {
      if (this.scopes.get(i).has(name.lexeme)) {
        this.interpreter.resolve(expr, this.scopes.size() - 1 - i);
        return;
      }
    }
  }
}

class Stack<T> {
  items: T[] = [];

  size() {
    return this.items.length;
  }

  isEmpty() {
    return this.size() === 0;
  }

  get(index: number) {
    return this.items[index];
  }

  peek() {
    return this.get(this.items.length - 1);
  }

  push(item: T) {
    this.items.push(item);
  }

  pop() {
    return this.items.pop();
  }
}
