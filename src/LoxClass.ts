import { LoxCallable } from './LoxCallable';
import { Interpreter } from './Interpreter';
import { LoxInstance } from './LoxInstance';

export class LoxClass extends LoxCallable {
  name: string;

  constructor(name: string) {
    super();
    this.name = name;
  }

  arity(): number {
    return 0;
  }

  call(interpreter: Interpreter, args: any[]): any {
    const instance = new LoxInstance(this);
    return instance;
  }

  toString(): string {
    return `<class ${this.name}>`;
  }
}
