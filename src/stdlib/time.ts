import { LoxCallable } from '../LoxCallable';
import { Interpreter } from '../Interpreter';

export const time = new class extends LoxCallable {
  arity() {
    return 0;
  }

  call(interpreter: Interpreter, args: any[]) {
    return Date.now();
  }
}();
