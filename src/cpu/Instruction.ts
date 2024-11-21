export class Instruction {
  public instruction: number;
  public op: number;
  public rs: number;
  public rt: number;
  public rd: number
  public funct: number;
  public immediate: number;
  public address: number;

  constructor(instruction: number) {
    this.instruction = instruction;
    this.op        = (parseInt('1111000000000000', 2) & this.instruction) >> 12;
    this.rs        = (parseInt('0000111000000000', 2) & this.instruction) >> 9;
    this.rt        = (parseInt('0000000111000000', 2) & this.instruction) >> 6;
    this.rd        = (parseInt('0000000000111000', 2) & this.instruction) >> 3;
    this.funct     = (parseInt('0000000000000111', 2) & this.instruction);
    this.immediate = (parseInt('0000000000111111', 2) & this.instruction);
    this.address   = (parseInt('0000111111111111', 2) & this.instruction);
  }

}