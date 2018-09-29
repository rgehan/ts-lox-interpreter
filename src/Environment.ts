import { Token } from './Token';
import { RuntimeError } from './Interpreter';

export class Environment {
  enclosing: Environment;
  values: Map<string, any>;

  constructor(enclosing: Environment = null) {
    this.enclosing = enclosing;
    this.values = new Map();
  }

  get(varToken: Token): any {
    const variableName = varToken.lexeme;

    // The variable exists in this environment
    if (this.values.has(variableName)) {
      return this.values.get(variableName);
    }

    // If the variable couldn't be found in this environment, look in the parent
    if (this.enclosing) {
      return this.enclosing.get(varToken);
    }

    throw new RuntimeError(varToken, `Undefined variable '${variableName}'.`);
  }

  assign(varToken: Token, value: any): any {
    const variableName = varToken.lexeme;

    // The variable exists in this environment
    if (this.values.has(variableName)) {
      return this.values.set(variableName, value);
    }

    // If the variable couldn't be found in this environment, look in the parent
    if (this.enclosing) {
      return this.enclosing.assign(varToken, value);
    }

    throw new RuntimeError(varToken, `Undefined variable '${variableName}'.`);
  }

  define(name: string, value: any) {
    this.values.set(name, value);
  }
}
