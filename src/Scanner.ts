import { Lox } from './Lox';
import { Token } from './Token';
import { TokenType as TT } from './TokenType';
import { isDigit, isAlphaNumeric } from './utils';

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

const KEYWORDS: { [k: string]: TT } = {
  and: TT.AND,
  class: TT.CLASS,
  else: TT.ELSE,
  false: TT.FALSE,
  for: TT.FOR,
  fun: TT.FUN,
  if: TT.IF,
  nil: TT.NIL,
  or: TT.OR,
  print: TT.PRINT,
  return: TT.RETURN,
  super: TT.SUPER,
  this: TT.THIS,
  true: TT.TRUE,
  var: TT.VAR,
  while: TT.WHILE,
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

      // Handle string literals
      case '"':
        this.string();
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

      // Other use cases
      default:
        if (isDigit(char)) {
          this.number();
          break;
        }

        if (isAlphaNumeric(char)) {
          this.identifier();
          break;
        }

        Lox.errorAtLine(this.line, `Unexpected character: ${char}.`);
        break;
    }
  }

  advance() {
    this.current++;
    return this.source[this.current - 1];
  }

  addToken(type: TT, literal: any = null) {
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

  peekNext(): string {
    if (this.current + 1 >= this.source.length) {
      return '\0';
    }

    return this.source[this.current + 1];
  }

  /**
   * Iterates on characters until it finds a string delimiter. If a newline
   * is found in the string, increment the line counter
   */
  string() {
    while (this.peek() !== '"' && !this.isAtEnd()) {
      if (this.peek() === '\n') {
        this.line++;
      }

      this.advance();
    }

    if (this.isAtEnd()) {
      Lox.errorAtLine(this.line, 'Unterminated string.');
    }

    // Advances over the closing string delimiter
    this.advance();

    // Add the string token
    const value = this.source.substring(this.start + 1, this.current - 1);
    this.addToken(TT.STRING, value);
  }

  number() {
    // Consume all the digits
    while (isDigit(this.peek())) {
      this.advance();
    }

    // Consume the fractional part
    if (this.peek() === '.' && isDigit(this.peekNext())) {
      this.advance();

      while (isDigit(this.peek())) {
        this.advance();
      }
    }

    this.addToken(
      TT.NUMBER,
      Number.parseFloat(this.source.substring(this.start, this.current))
    );
  }

  identifier() {
    while (isAlphaNumeric(this.peek())) {
      this.advance();
    }

    // Extract the identifier value and check if it's a keyword
    const text = this.source.substring(this.start, this.current);
    const tokenType = KEYWORDS[text] || TT.IDENTIFIER;

    this.addToken(tokenType);
  }
}
