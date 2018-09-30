export class LoxClass {
  name: string;

  constructor(name: string) {
    this.name = name;
  }

  toString(): string {
    return `<class ${this.name}>`;
  }
}
