import { LoxClass } from './LoxClass';

export class LoxInstance {
  klass: LoxClass;

  constructor(klass: LoxClass) {
    this.klass = klass;
  }

  toString(): string {
    return `<instance of ${this.klass.name}>`;
  }
}
