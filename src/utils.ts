export function isDigit(string: string) {
  const char = string[0];
  return '0' <= char && char <= '9';
}
