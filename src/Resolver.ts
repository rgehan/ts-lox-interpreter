import * as Expr from './Expr';
import * as Stmt from './Stmt';
import { Token } from './Token';
import { Interpreter } from './Interpreter';
import { Lox } from './Lox';

type Scope = Map<string, boolean>;
type Resolveable = Expr.Expr | Stmt.Stmt;
enum FunctionType {
  NONE,
  METHOD,
  FUNCTION,
  INITIALIZER,
}
enum LoopType {
  NONE,
  LOOP,
}
enum ClassType {
  NONE,
  CLASS,
}

export class Resolver implements Expr.Visitor<void>, Stmt.Visitor<void> {
  interpreter: Interpreter;
  scopes: Stack<Scope>;
  currentFunction: FunctionType;
  currentLoop: LoopType;
  currentClass: ClassType;

  constructor(interpreter: Interpreter) {
    this.interpreter = interpreter;
    this.scopes = new Stack();
    this.currentFunction = FunctionType.NONE;
    this.currentLoop = LoopType.NONE;
    this.currentClass = ClassType.NONE;
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

  visitClassStmt(stmt: Stmt.Class) {
    const enclosingClass = this.currentClass;
    this.currentClass = ClassType.CLASS;

    this.declare(stmt.name);
    this.define(stmt.name);

    this.beginScope();
    this.scopes.peek().set('this', true);

    for (const method of stmt.methods) {
      const declaration =
        method.expression.name.lexeme === 'init'
          ? FunctionType.INITIALIZER
          : FunctionType.METHOD;

      this.resolveFunction(method.expression, declaration);
    }

    this.endScope();

    this.currentClass = enclosingClass;
  }

  visitFunctionStmt(stmt: Stmt.Function) {
    const fnExpr = stmt.expression as Expr.Function;

    this.declare(fnExpr.name);
    this.define(fnExpr.name);

    this.resolveFunction(fnExpr, FunctionType.FUNCTION);
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
      if (this.currentFunction === FunctionType.INITIALIZER) {
        Lox.errorAtToken(
          stmt.keyword,
          'Cannot return a value from class constructor.'
        );
      }

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

  visitFunctionExpr(expr: Expr.Function) {
    this.resolveFunction(expr, FunctionType.FUNCTION);
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

  visitGetExpr(expr: Expr.Get) {
    this.resolve(expr.object);
  }

  visitGroupingExpr(expr: Expr.Grouping) {
    this.resolve(expr.expression);
  }

  visitLogicalExpr(expr: Expr.Logical) {
    this.resolve(expr.left);
    this.resolve(expr.right);
  }

  visitSetExpr(expr: Expr.Set) {
    this.resolve(expr.value);
    this.resolve(expr.object);
  }

  visitThisExpr(expr: Expr.This) {
    if (this.currentClass === ClassType.NONE) {
      Lox.errorAtToken(expr.keyword, 'Cannot use "this" outside of a class.');
    }

    this.resolveLocal(expr, expr.keyword);
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

  private resolveFunction(fn: Expr.Function, type: FunctionType) {
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
