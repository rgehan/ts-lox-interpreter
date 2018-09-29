import { LoxCallable } from '../LoxCallable';
import { Interpreter } from '../Interpreter';

export default new class extends LoxCallable {
  arity() {
    return 0;
  }

  call(interpreter: Interpreter, args: any[]) {
    return Date.now();
  }
}();
