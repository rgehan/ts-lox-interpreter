import { LoxClass } from './LoxClass';
import { Token } from './Token';
import { RuntimeError } from './Interpreter';

type Fields = Map<string, any>;

export class LoxInstance {
  klass: LoxClass;
  fields: Fields;

  constructor(klass: LoxClass) {
    this.klass = klass;
    this.fields = new Map();
  }

  get(name: Token) {
    if (this.fields.has(name.lexeme)) {
      return this.fields.get(name.lexeme);
    }

    throw new RuntimeError(name, `Undefined property "${name.lexeme}".`);
  }

  toString(): string {
    return `<instance of ${this.klass.name}>`;
  }
}
