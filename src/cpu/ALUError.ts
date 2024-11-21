import { Instruction } from "./Instruction";

export class ALUError extends Error {
  constructor(instruction: Instruction) {
    super(`Invalid funct: ${instruction.funct.toString(2)}`);
  }
}