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

  getAt(distance: number, name: string): any {
    return this.ancestor(distance).values.get(name);
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

  assignAt(distance: number, name: Token, value: any) {
    return this.ancestor(distance).values.set(name.lexeme, value);
  }

  define(name: string, value: any) {
    this.values.set(name, value);
  }

  ancestor(distance: number): Environment {
    let environment: Environment = this;
    for (let i = 0; i < distance; i++) {
      environment = environment.enclosing;
    }
    return environment;
  }
}
