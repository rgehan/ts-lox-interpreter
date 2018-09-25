import fs from 'fs';
import readline from 'readline';

import { Scanner } from './Scanner';
import { Token } from './Token';

export class Lox {
  static hadError: boolean = false;

  /**
   * Run some Lox source
   * @param source Lox source code
   */
  run(source: string) {
    const scanner: Scanner = new Scanner(source);
    const tokens: Token[] = scanner.scanTokens();

    for (const token of tokens) {
      console.log(token);
    }
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

  static error(line: number, message: string) {
    Lox.report(line, '', message);
  }

  static report(line: number, where: string, message: string) {
    console.log(`[line ${line}] Error${where}: ${message}`);
    Lox.hadError = true;
  }
}
