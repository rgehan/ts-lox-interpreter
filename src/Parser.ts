import { Lox } from './Lox';
import { Token } from './Token';
import { TokenType as TT } from './TokenType';
import * as Expr from './Expr';
import * as Stmt from './Stmt';

/*
 * program        → declaration* EOF ;
 * declaration    → funDecl
 *                | varDecl
 *                | statement
 * funDecl        → "fun" IDENTIFIER "(" parameters? ")" block ;
 * parameters     → IDENTIFIER ( "," IDENTIFIER )* ;
 * varDecl        → "var" IDENTIFIER ( "=" expression )? ";" ;
 * statement      → exprStmt
 *                | forStmt
 *                | ifStmt
 *                | printStmt
 *                | returnStmt
 *                | whileStmt
 *                | block ;
 * exprStmt       → expression ";" ;
 * forStmt        → "for" "(" ( varDecl | exprStmt | ";" )
 *                            expression? ";"
 *                            expression? ")" statement ;
 * ifStmt         → "if" "(" expression ")" statement ("else" statement)? ;
 * whileStmt      → "while" "(" expression ")" statement ;
 * printStmt      → "print" expression ";" ;
 * returnStmt     → "return" expression? ";" ;
 * block          → "{" declaration* "}" ;
 * expression     → comma ;
 * comma          → assignment ( "," equality)* ;
 * assignment     → IDENTIFIER "=" assignment
 *                | logic_or ;
 * logic_or       → logic_and ( "or" logic_and )* ;
 * logic_and      → equality ( "and" equality )* ;
 * equality       → comparison ( ( "!=" | "==" ) comparison )* ;
 * comparison     → addition ( ( ">" | ">=" | "<" | "<=" ) addition )* ;
 * addition       → multiplication ( ( "-" | "+" ) multiplication )* ;
 * multiplication → modulo ( ( "/" | "*" ) modulo )* ;
 * modulo         → exponent ( "%" exponent )* ;
 * exponent       → unary ( "^" unary )* ;
 * unary          → ( "!" | "-" ) unary
 *                | call ;
 * call           → primary ( "(" arguments? ")" )* ;
 * arguments      → expression ( "," expression )* ;
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
      if (this.match(TT.FUN)) return this.function('function');
      if (this.match(TT.VAR)) return this.varDeclaration();

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
    if (this.match(TT.FOR)) return this.forStatement();
    if (this.match(TT.IF)) return this.ifStatement();
    if (this.match(TT.WHILE)) return this.whileStatement();
    if (this.match(TT.PRINT)) return this.printStatement();
    if (this.match(TT.RETURN)) return this.returnStatement();
    if (this.match(TT.LEFT_BRACE)) return new Stmt.Block(this.block());

    return this.expressionStatement();
  }

  private forStatement(): Stmt.Stmt {
    this.consume(TT.LEFT_PAREN, 'Expect "(" after "for".');

    let initializer: Stmt.Stmt = null;
    if (this.match(TT.SEMICOLON)) {
      initializer = null;
    } else if (this.match(TT.VAR)) {
      initializer = this.varDeclaration();
    } else {
      initializer = this.expressionStatement();
    }

    let condition: Expr.Expr = new Expr.Literal(true);
    if (!this.check(TT.SEMICOLON)) {
      condition = this.expression();
    }
    this.consume(TT.SEMICOLON, 'Expect ";" after loop condition.');

    let increment: Expr.Expr = null;
    if (!this.check(TT.RIGHT_PAREN)) {
      increment = this.expression();
    }
    this.consume(TT.RIGHT_PAREN, 'Expect ")" after for clauses.');

    let body: Stmt.Stmt = this.statement();

    /*
     * Desugaring the for loop in a while loop
     */

    if (increment) {
      body = new Stmt.Block([body, new Stmt.Expression(increment)]);
    }

    body = new Stmt.While(condition, body);

    if (initializer) {
      body = new Stmt.Block([initializer, body]);
    }

    return body;
  }

  private ifStatement(): Stmt.Stmt {
    this.consume(TT.LEFT_PAREN, 'Expect "(" after "if".');
    const condition: Expr.Expr = this.expression();
    this.consume(TT.RIGHT_PAREN, 'Expect ")" after if condition.');

    const thenBranch: Stmt.Stmt = this.statement();
    let elseBranch: Stmt.Stmt = null;

    if (this.match(TT.ELSE)) {
      elseBranch = this.statement();
    }

    return new Stmt.If(condition, thenBranch, elseBranch);
  }

  private whileStatement(): Stmt.Stmt {
    this.consume(TT.LEFT_PAREN, 'Expect "(" after "while".');
    const condition: Expr.Expr = this.expression();
    this.consume(TT.RIGHT_PAREN, 'Expect ")" after while loop condition.');
    const body = this.statement();

    return new Stmt.While(condition, body);
  }

  private printStatement(): Stmt.Stmt {
    const value: Expr.Expr = this.expression();
    this.consume(TT.SEMICOLON, 'Expect ";" after value.');
    return new Stmt.Print(value);
  }

  private returnStatement(): Stmt.Stmt {
    const keyword: Token = this.previous();

    let value: Expr.Expr;
    if (!this.check(TT.SEMICOLON)) {
      value = this.expression();
    }

    this.consume(TT.SEMICOLON, 'Expect ";" after return value.');

    return new Stmt.Return(keyword, value);
  }

  private expressionStatement(): Stmt.Stmt {
    const expr: Expr.Expr = this.expression();
    this.consume(TT.SEMICOLON, 'Expect ";" after value.');
    return new Stmt.Expression(expr);
  }

  private function(kind: string): Stmt.Function {
    const name: Token = this.consume(TT.IDENTIFIER, `Expect ${kind} name.`);
    this.consume(TT.LEFT_PAREN, `Expect "(" after ${kind} name.`);

    const parameters: Token[] = [];
    if (!this.check(TT.RIGHT_PAREN)) {
      do {
        if (parameters.length >= 8) {
          this.error(this.peek(), 'Cannot have more than 8 parameters.');
        }

        parameters.push(this.consume(TT.IDENTIFIER, 'Expect parameter name.'));
      } while (this.match(TT.COMMA));
    }

    this.consume(TT.RIGHT_PAREN, 'Expect ")" after parameters.');
    this.consume(TT.LEFT_BRACE, `Expect "{" before ${kind} body.`);

    const body: Stmt.Stmt[] = this.block();

    return new Stmt.Function(name, parameters, body);
  }

  private block(): Stmt.Stmt[] {
    const statements: Stmt.Stmt[] = [];

    while (!this.check(TT.RIGHT_BRACE) && !this.isAtEnd()) {
      statements.push(this.declaration());
    }

    this.consume(TT.RIGHT_BRACE, 'Expect "}" after block.');
    return statements;
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
    const expr: Expr.Expr = this.or();

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

  private or(): Expr.Expr {
    let expr: Expr.Expr = this.and();

    while (this.match(TT.OR)) {
      const operator: Token = this.previous();
      const right: Expr.Expr = this.and();
      expr = new Expr.Logical(expr, operator, right);
    }

    return expr;
  }

  private and(): Expr.Expr {
    let expr: Expr.Expr = this.equality();

    while (this.match(TT.AND)) {
      const operator: Token = this.previous();
      const right: Expr.Expr = this.equality();
      expr = new Expr.Logical(expr, operator, right);
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
    let expr: Expr.Expr = this.modulo();

    while (this.match(TT.SLASH, TT.STAR)) {
      const operator: Token = this.previous();
      const right: Expr.Expr = this.modulo();
      expr = new Expr.Binary(expr, operator, right);
    }

    return expr;
  }

  private modulo(): Expr.Expr {
    let expr: Expr.Expr = this.exponent();

    while (this.match(TT.PERCENT)) {
      const operator: Token = this.previous();
      const right: Expr.Expr = this.exponent();
      expr = new Expr.Binary(expr, operator, right);
    }

    return expr;
  }

  private exponent(): Expr.Expr {
    let expr: Expr.Expr = this.unary();

    while (this.match(TT.HAT)) {
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

    return this.call();
  }

  private call(): Expr.Expr {
    let expr: Expr.Expr = this.primary();

    while (true) {
      if (this.match(TT.LEFT_PAREN)) {
        expr = this.finishCall(expr);
      } else {
        break;
      }
    }

    return expr;
  }

  private finishCall(callee: Expr.Expr): Expr.Expr {
    const args: Expr.Expr[] = [];

    // If there are arguments to extract...
    if (!this.check(TT.RIGHT_PAREN)) {
      do {
        if (args.length >= 8) {
          this.error(this.peek(), 'Cannot have more than 8 arguments.');
        }

        args.push(this.expression());
      } while (this.match(TT.COMMA));
    }

    const paren: Token = this.consume(
      TT.RIGHT_PAREN,
      'Expect ")" after arguments.'
    );

    return new Expr.Call(callee, paren, args);
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
