import { LoxCallable } from '../LoxCallable';
import clock from './clock';

const fns: { [k: string]: LoxCallable } = {
  clock,
};

export default fns;
