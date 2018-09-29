import fs from 'fs';
import readline from 'readline';

import { Scanner } from './Scanner';
import { Parser } from './Parser';
import { Token } from './Token';
import { TokenType as TT } from './TokenType';
import * as Stmt from './Stmt';
import { Interpreter, RuntimeError } from './Interpreter';
import { Resolver } from './Resolver';

export class Lox {
  static hadError: boolean = false;
  static hadRuntimeError: boolean = false;

  static interpreter: Interpreter = new Interpreter();

  /**
   * Run some Lox source
   * @param source Lox source code
   */
  run(source: string, coerceSingleExpressionToStatement: boolean = false) {
    const scanner: Scanner = new Scanner(source);
    const tokens: Token[] = scanner.scanTokens();

    const parser: Parser = new Parser(tokens);
    const statements: Stmt.Stmt[] = parser.parse();

    const resolver: Resolver = new Resolver(Lox.interpreter);
    resolver.resolve(...statements);

    // Do not bother interpreting if an error happened, as it would pollute
    // the console output with native JavaScript errors
    if (Lox.hadError) {
      return;
    }

    // If there is only a single statement, and it's an expression statement,
    // we'll treat it as if it was a print statement.
    if (
      coerceSingleExpressionToStatement &&
      statements.length === 1 &&
      statements[0] instanceof Stmt.Expression
    ) {
      const expression = (statements[0] as Stmt.Expression).expression;
      statements[0] = new Stmt.Print(expression);
    }

    Lox.interpreter.interpret(statements);
  }

  /**
   * Interpret a Lox file
   * @param path The path of the file to interpret
   */
  runFile(path: string) {
    const source = fs.readFileSync(path, 'utf8');
    this.run(source);

    if (Lox.hadError) {
      process.exit(65);
    }

    if (Lox.hadRuntimeError) {
      process.exit(70);
    }
  }

  /**
   * Start a Lox interactive session
   */
  runPrompt() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    Lox.hadError = false;
    Lox.hadRuntimeError = false;

    rl.question('> ', snippet => {
      rl.close();

      if (snippet === 'exit') {
        return;
      }

      this.run(snippet, true);
      this.runPrompt();
    });
  }

  static errorAtLine(line: number, message: string) {
    Lox.report(line, '', message);
  }

  static errorAtToken(token: Token, message: string) {
    if (token.type === TT.EOF) {
      this.report(token.line, ' at end', message);
    } else {
      this.report(token.line, ` at '${token.lexeme}'`, message);
    }
  }

  static report(line: number, where: string, message: string) {
    console.log(`[line ${line}] Error${where}: ${message}`);
    Lox.hadError = true;
  }

  static runtimeError(error: RuntimeError) {
    console.error(`[line ${error.token.line}] ${error.message}`);
    Lox.hadRuntimeError = true;
  }
}
