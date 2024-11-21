export function signExtend(value: number): number {
  if(value & parseInt('100000', 2)) {
    return value | parseInt('11111111111111111111111111000000', 2);
  }
  return value;
}
