import fs from 'fs';
import readline from 'readline';

import { Scanner } from './Scanner';
import { Parser } from './Parser';
import { Token } from './Token';
import { TokenType as TT } from './TokenType';
import * as Expr from './Expr';
import { AstPrinter } from './AstPrinter';

export class Lox {
  static hadError: boolean = false;

  /**
   * Run some Lox source
   * @param source Lox source code
   */
  run(source: string) {
    const scanner: Scanner = new Scanner(source);
    const tokens: Token[] = scanner.scanTokens();

    // Print the tokens
    console.log('## Tokens:');
    for (const token of tokens) {
      console.log(token);
    }

    const parser: Parser = new Parser(tokens);
    const expression: Expr.Expr = parser.parse();

    console.log('\n## AST:');
    console.log(new AstPrinter().print(expression));
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

    rl.question('> ', snippet => {
      rl.close();

      if (snippet === 'exit') {
        return;
      }

      this.run(snippet);
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
}
