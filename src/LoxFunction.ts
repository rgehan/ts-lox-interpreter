import { LoxCallable } from './LoxCallable';
import * as Stmt from './Stmt';
import { Interpreter } from './Interpreter';
import { Environment } from './Environment';
import { Return } from './Return';

export class LoxFunction extends LoxCallable {
  declaration: Stmt.Function;

  constructor(declaration: Stmt.Function) {
    super();
    this.declaration = declaration;
  }

  arity() {
    return this.declaration.params.length;
  }

  call(interpreter: Interpreter, args: any[]) {
    // Create a fresh scope for the function call
    const environment = new Environment(interpreter.globals);

    // "Inject" the parameters values inside the environment
    for (let i = 0; i < this.declaration.params.length; i++) {
      const paramName = this.declaration.params[i].lexeme;
      environment.define(paramName, args[i]);
    }

    // Execute the function's code with the, now, correct data
    try {
      interpreter.executeBlock(this.declaration.body, environment);
    } catch (error) {
      if (error instanceof Return) {
        return error.value;
      }
    }

    return null;
  }

  toString(): string {
    return `<fn ${this.declaration.name.lexeme}>`;
  }
}
