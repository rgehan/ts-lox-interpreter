import { LoxCallable } from './LoxCallable';
import { Interpreter } from './Interpreter';
import { LoxInstance } from './LoxInstance';
import { LoxFunction } from './LoxFunction';

export type Methods = Map<string, LoxFunction>;

export class LoxClass extends LoxCallable {
  name: string;
  methods: Methods;

  constructor(name: string, methods: Methods) {
    super();
    this.name = name;
    this.methods = methods;
  }

  findMethod(instance: LoxInstance, name: string): LoxFunction {
    if (this.methods.has(name)) {
      return this.methods.get(name).bind(instance);
    }

    return null;
  }

  arity(): number {
    const initializer = this.methods.get('init');
    if (initializer) {
      return initializer.arity();
    }

    return 0;
  }

  call(interpreter: Interpreter, args: any[]): any {
    const instance = new LoxInstance(this);

    const initializer = this.methods.get('init');
    if (initializer) {
      initializer.bind(instance).call(interpreter, args);
    }

    return instance;
  }

  toString(): string {
    return `<class ${this.name}>`;
  }
}
