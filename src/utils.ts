export function isDigit(string: string) {
  const char = string[0];
  return '0' <= char && char <= '9';
}

export function isAlpha(string: string) {
  const char = string[0];
  return (
    ('a' <= char && char <= 'z') || ('A' <= char && char <= 'Z') || char === '_'
  );
}

export function isAlphaNumeric(string: string) {
  return isAlpha(string) || isDigit(string);
}
