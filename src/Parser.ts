import { Lox } from './Lox';
import { Token } from './Token';
import { TokenType as TT } from './TokenType';
import * as Expr from './Expr';
import * as Stmt from './Stmt';

/*
 * program        → declaration* EOF ;
 * declaration    → varDecl | statement ;
 * varDecl        → "var" IDENTIFIER ( "=" expression )? ";" ;
 * statement      → exprStmt | printStmt ;
 * exprStmt       → expression ";" ;
 * printStmt      → "print" expression ";" ;
 * expression     → comma ;
 * comma          → assignment ( "," equality)* ;
 * assignment     → IDENTIFIER "=" assignment | equality ;
 * equality       → comparison ( ( "!=" | "==" ) comparison )* ;
 * comparison     → addition ( ( ">" | ">=" | "<" | "<=" ) addition )* ;
 * addition       → multiplication ( ( "-" | "+" ) multiplication )* ;
 * multiplication → unary ( ( "/" | "*" ) unary )* ;
 * unary          → ( "!" | "-" ) unary
 *                | primary ;
 * primary        → "false" | "true" | "nil" | "this"
 *                | NUMBER | STRING
 *                | "(" expression ")"
 *                | IDENTIFIER;
 */

class ParseError extends Error {}

export class Parser {
  tokens: Token[];
  current: number = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  parse(): Stmt.Stmt[] {
    const statements: Stmt.Stmt[] = [];

    while (!this.isAtEnd()) {
      statements.push(this.declaration());
    }

    return statements;
  }

  private declaration(): Stmt.Stmt {
    try {
      if (this.match(TT.VAR)) {
        return this.varDeclaration();
      }

      return this.statement();
    } catch (error) {
      this.synchronize();
      return null;
    }
  }

  private varDeclaration(): Stmt.Stmt {
    const name: Token = this.consume(TT.IDENTIFIER, 'Expect variable name.');

    let initializer: Expr.Expr = null;
    if (this.match(TT.EQUAL)) {
      initializer = this.expression();
    }

    this.consume(TT.SEMICOLON, 'Expect ";" after variable declaration');
    return new Stmt.Var(name, initializer);
  }

  private statement(): Stmt.Stmt {
    if (this.match(TT.PRINT)) {
      return this.printStatement();
    }

    return this.expressionStatement();
  }

  private printStatement(): Stmt.Stmt {
    const value: Expr.Expr = this.expression();
    this.consume(TT.SEMICOLON, 'Expect ";" after value.');
    return new Stmt.Print(value);
  }

  private expressionStatement(): Stmt.Stmt {
    const expr: Expr.Expr = this.expression();
    this.consume(TT.SEMICOLON, 'Expect ";" after value.');
    return new Stmt.Expression(expr);
  }

  private expression(): Expr.Expr {
    return this.comma();
  }

  private comma(): Expr.Expr {
    let expr: Expr.Expr = this.assignment();

    while (this.match(TT.COMMA)) {
      const operator: Token = this.previous();
      const right: Expr.Expr = this.assignment();
      expr = new Expr.Binary(expr, operator, right);
    }

    return expr;
  }

  private assignment(): Expr.Expr {
    const expr: Expr.Expr = this.equality();

    if (this.match(TT.EQUAL)) {
      const equals: Token = this.previous();
      const value: Expr.Expr = this.assignment();

      if (expr instanceof Expr.Variable) {
        const name: Token = (expr as Expr.Variable).name;
        return new Expr.Assign(name, value);
      }

      this.error(equals, 'Invalid assignment target.');
    }

    return expr;
  }

  private equality(): Expr.Expr {
    let expr: Expr.Expr = this.comparison();

    while (this.match(TT.BANG_EQUAL, TT.EQUAL_EQUAL)) {
      const operator: Token = this.previous();
      const right: Expr.Expr = this.comparison();
      expr = new Expr.Binary(expr, operator, right);
    }

    return expr;
  }

  private comparison(): Expr.Expr {
    let expr: Expr.Expr = this.addition();

    while (this.match(TT.GREATER, TT.GREATER_EQUAL, TT.LESS, TT.LESS_EQUAL)) {
      const operator: Token = this.previous();
      const right: Expr.Expr = this.addition();
      expr = new Expr.Binary(expr, operator, right);
    }

    return expr;
  }

  private addition(): Expr.Expr {
    let expr: Expr.Expr = this.multiplication();

    while (this.match(TT.MINUS, TT.PLUS)) {
      const operator: Token = this.previous();
      const right: Expr.Expr = this.multiplication();
      expr = new Expr.Binary(expr, operator, right);
    }

    return expr;
  }

  private multiplication(): Expr.Expr {
    let expr: Expr.Expr = this.unary();

    while (this.match(TT.SLASH, TT.STAR)) {
      const operator: Token = this.previous();
      const right: Expr.Expr = this.unary();
      expr = new Expr.Binary(expr, operator, right);
    }

    return expr;
  }

  private unary(): Expr.Expr {
    if (this.match(TT.BANG, TT.MINUS)) {
      const operator: Token = this.previous();
      const right: Expr.Expr = this.unary();
      return new Expr.Unary(operator, right);
    }

    return this.primary();
  }

  private primary(): Expr.Expr {
    if (this.match(TT.FALSE)) return new Expr.Literal(false);
    if (this.match(TT.TRUE)) return new Expr.Literal(true);
    if (this.match(TT.NIL)) return new Expr.Literal(null);

    if (this.match(TT.NUMBER, TT.STRING)) {
      return new Expr.Literal(this.previous().literal);
    }

    if (this.match(TT.IDENTIFIER)) {
      return new Expr.Variable(this.previous());
    }

    if (this.match(TT.LEFT_PAREN)) {
      const expr: Expr.Expr = this.expression();
      this.consume(TT.RIGHT_PAREN, "Expect ')' after expression.");
      return new Expr.Grouping(expr);
    }

    throw this.error(this.peek(), 'Expect expression.');
  }

  /**
   * Check if the given token matches one of the given types. If it matches,
   * the token is consumed.
   * @param types The types of token we want to check if it matches for
   */
  private match(...types: TT[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }

    return false;
  }

  /**
   * Checks if the current token matches the given TokenType
   * @param type The type of token we want to check if it matches for
   */
  private check(type: TT): boolean {
    if (this.isAtEnd()) {
      return false;
    }

    return this.peek().type === type;
  }

  /**
   * Advance to the next token and return the consumed token.
   */
  private advance(): Token {
    if (!this.isAtEnd()) {
      this.current++;
    }

    return this.previous();
  }

  /**
   * Return whether we are already on the last token
   */
  private isAtEnd(): boolean {
    return this.peek().type === TT.EOF;
  }

  /**
   * Return the current token
   */
  private peek(): Token {
    return this.tokens[this.current];
  }

  /**
   * Return the previous token
   */
  private previous(): Token {
    return this.tokens[this.current - 1];
  }

  /**
   * Attempt to consume a token of a given type. If there is no such token, it
   * will report an error and throw a ParseError
   * @param type The type of token to consume
   * @param message What error is reported if there is no such token to consume
   */
  private consume(type: TT, message: string) {
    if (!this.check(type)) {
      throw this.error(this.peek(), message);
    }

    return this.advance();
  }

  /**
   * Discard tokens until we can start with the next statement. This is used
   * as a recovery mechanism after a ParseError
   */
  private synchronize() {
    this.advance();

    while (!this.isAtEnd()) {
      if (this.previous().type === TT.SEMICOLON) {
        return;
      }

      if (
        [
          TT.CLASS,
          TT.FUN,
          TT.VAR,
          TT.FOR,
          TT.IF,
          TT.WHILE,
          TT.PRINT,
          TT.RETURN,
        ].indexOf(this.peek().type) !== -1
      ) {
        return;
      }

      this.advance();
    }
  }

  private error(token: Token, message: string): ParseError {
    Lox.errorAtToken(token, message);
    return new ParseError();
  }
}
