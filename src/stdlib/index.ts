import { LoxCallable } from '../LoxCallable';
import { time } from './time';

const fns: { [k: string]: LoxCallable } = {
  time,
};

export default fns;
