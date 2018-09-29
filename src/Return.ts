export class Return extends Error {
  value: any;

  constructor(value: any) {
    super('Return');
    this.value = value;
  }
}
