import { Lox } from './Lox';
import { Token } from './Token';
import { TokenType as TT } from './TokenType';

const CHAR_TO_TOKEN_MAP: { [k: string]: TT } = {
  '(': TT.LEFT_PAREN,
  ')': TT.RIGHT_PAREN,
  '{': TT.LEFT_BRACE,
  '}': TT.RIGHT_BRACE,
  ',': TT.COMMA,
  '.': TT.DOT,
  '-': TT.MINUS,
  '+': TT.PLUS,
  ';': TT.SEMICOLON,
  '*': TT.STAR,
};

export class Scanner {
  source: string;
  tokens: Token[] = [];

  start: number = 0;
  current: number = 0;
  line: number = 1;

  constructor(source: string) {
    this.source = source;
  }

  scanTokens(): Token[] {
    while (!this.isAtEnd()) {
      this.start = this.current;
      this.scanToken();
    }

    const endToken = new Token(TT.EOF, '', null, this.line);
    this.tokens.push(endToken);

    return this.tokens;
  }

  isAtEnd(): boolean {
    return this.current >= this.source.length;
  }

  scanToken() {
    const char = this.advance();
    const isBasicToken = CHAR_TO_TOKEN_MAP[char] !== undefined;

    if (isBasicToken) {
      this.addToken(CHAR_TO_TOKEN_MAP[char]);
      return;
    }

    switch (char) {
      case '!':
        this.addToken(this.match('=') ? TT.BANG_EQUAL : TT.BANG);
        break;
      case '=':
        this.addToken(this.match('=') ? TT.EQUAL_EQUAL : TT.EQUAL);
        break;
      case '<':
        this.addToken(this.match('=') ? TT.LESS_EQUAL : TT.LESS);
        break;
      case '>':
        this.addToken(this.match('=') ? TT.GREATER_EQUAL : TT.GREATER);
        break;

      // Handle both the division operator and single-line comments
      case '/':
        if (!this.match('/')) {
          this.addToken(TT.SLASH);
        }

        while (this.peek() !== '\n' && !this.isAtEnd()) {
          this.advance();
        }
        break;

      // Ignore white-spaces
      case ' ':
      case '\r':
      case '\t':
        break;

      // Keep track of lines
      case '\n':
        this.line++;
        break;
      default:
        Lox.error(this.line, 'Unexpected character.');
        break;
    }
  }

  advance() {
    this.current++;
    return this.source[this.current - 1];
  }

  addToken(type: TT, literal: object = null) {
    const text: string = this.source.substring(this.start, this.current);
    const token = new Token(type, text, literal, this.line);
    this.tokens.push(token);
  }

  match(expected: string): boolean {
    if (this.isAtEnd() || this.source[this.current] !== expected) {
      return false;
    }

    this.current++;
    return true;
  }

  peek(): string {
    if (this.isAtEnd()) {
      return '\0';
    }

    return this.source[this.current];
  }
}
