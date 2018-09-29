import { Token } from './Token';
import { RuntimeError } from './Interpreter';

export class Environment {
  values: { [k: string]: any } = {};

  get(varToken: Token): any {
    const variableName = varToken.lexeme;

    if (this.values[variableName] === undefined) {
      throw new RuntimeError(varToken, `Undefined variable '${variableName}'.`);
    }

    return this.values[variableName];
  }

  define(name: string, value: any) {
    this.values[name] = value;
  }
}
