import { LoxCallable } from './LoxCallable';
import * as Expr from './Expr';
import { Interpreter } from './Interpreter';
import { Environment } from './Environment';
import { Return } from './Return';
import { LoxInstance } from './LoxInstance';

export class LoxFunction extends LoxCallable {
  declaration: Expr.Function;
  closure: Environment;
  isInitializer: boolean;

  constructor(
    declaration: Expr.Function,
    closure: Environment,
    isInitializer: boolean = false
  ) {
    super();
    this.declaration = declaration;
    this.closure = closure;
    this.isInitializer = isInitializer;
  }

  bind(instance: LoxInstance): LoxFunction {
    const environment = new Environment(this.closure);
    environment.define('this', instance);
    return new LoxFunction(this.declaration, environment);
  }

  arity() {
    return this.declaration.params.length;
  }

  call(interpreter: Interpreter, args: any[]) {
    // Create a fresh scope for the function call
    const environment = new Environment(this.closure);

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

      throw error;
    }

    // If this is the constructor, always return 'this'
    if (this.isInitializer) {
      return this.closure.getAt(0, 'this');
    }

    return null;
  }

  toString(): string {
    return `<fn ${this.declaration.name.lexeme}>`;
  }
}
