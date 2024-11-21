import { Instruction } from "./Instruction";

export class CPUError extends Error {
  constructor(instruction: Instruction) {
    super("Invalid op: " + instruction.instruction.toString(2));
  }
}