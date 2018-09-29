import { Token } from './Token';
import { RuntimeError } from './Interpreter';

export class Environment {
  values: Map<string, any> = new Map();

  get(varToken: Token): any {
    const variableName = varToken.lexeme;

    if (!this.values.has(variableName)) {
      throw new RuntimeError(varToken, `Undefined variable '${variableName}'.`);
    }

    return this.values.get(variableName);
  }

  assign(varToken: Token, value: any) {
    const variableName = varToken.lexeme;

    if (!this.values.has(variableName)) {
      throw new RuntimeError(varToken, `Undefined variable '${variableName}'.`);
    }

    return this.values.set(variableName, value);
  }

  define(name: string, value: any) {
    this.values.set(name, value);
  }
}
