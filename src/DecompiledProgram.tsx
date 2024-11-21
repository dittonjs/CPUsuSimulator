import { ReactElement } from "react";
import { Instruction } from "./cpu/Instruction";
import { signExtend } from "./cpu/signExtend";

type DecompiledProgramProps = {
  rom: ArrayLike<number>,
  highlightIndex: number
}

function disassembleInstruction(instruction: number): string {
  const decodedInstruction = new Instruction(instruction);
  switch(decodedInstruction.op) {
    case 0x0:
      return disassembleAlu(decodedInstruction);
    case 0x1:
      return `lw R${decodedInstruction.rt}, ${signExtend(decodedInstruction.immediate)}(R${decodedInstruction.rs})`;
    case 0x2:
      return `sw R${decodedInstruction.rt}, ${signExtend(decodedInstruction.immediate)}(R${decodedInstruction.rs})`;
    case 0x3:
      return `beq R${decodedInstruction.rt}, R${decodedInstruction.rs}, ${signExtend(decodedInstruction.immediate)}`;
    case 0x4:
      return `j ${decodedInstruction.address}`;
    case 0x5:
      return `addi R${decodedInstruction.rt}, R${decodedInstruction.rs}, ${signExtend(decodedInstruction.immediate)}`;
    case 0x6:
      return `bne R${decodedInstruction.rt}, R${decodedInstruction.rs},  ${signExtend(decodedInstruction.immediate)}`;
    case 0x7:
      return `jr R${decodedInstruction.rs}`;
    case 0x8:
      return `jal ${decodedInstruction.address}`;
    case 0xF:
      return `display`;
    default:
      return `Invalid op: ${decodedInstruction.op.toString(16).toUpperCase()}`;
  }
}

function disassembleAlu(instruction: Instruction): string {
  switch(instruction.funct) {
    case 0x0:
      return `and R${instruction.rd}, R${instruction.rs}, R${instruction.rt}`;
    case 0x1:
      return `or R${instruction.rd}, R${instruction.rs}, R${instruction.rt}`;
    case 0x2:
      return `add R${instruction.rd}, R${instruction.rs}, R${instruction.rt}`;
    case 0x6:
      return `sub R${instruction.rd}, R${instruction.rs}, R${instruction.rt}`;
    case 0x7:
      return `slt R${instruction.rd}, R${instruction.rs}, R${instruction.rt}`;
      break;
    default:
      return `Invalid ALU funct: ${instruction.funct.toString(16).toUpperCase()}`;
  }
}

export const DecompiledProgram = ({rom, highlightIndex}: DecompiledProgramProps) => {

  const elements: ReactElement[] = [];
  for(let i = 0; i < rom.length; i++) {
    if (rom[i] === 0) {
      elements.push(
        <tr key={i} className={highlightIndex === i ? 'highlight' : ''}>
          <td>
            {i.toString(16).padStart(4, '0').toUpperCase()}
          </td>
          <td>
            HALT
          </td>
        </tr>
      )
      break;
    }
    elements.push(
      <tr key={i} className={highlightIndex === i ? 'highlight' : ''}>
        <td>
          {i.toString(16).padStart(4, '0').toUpperCase()}
        </td>
        <td>
          {disassembleInstruction(rom[i])}
        </td>
      </tr>
    )
  }
  return (
    <div className="chip">
      <b>Program</b>
      <table>
        <thead>
          <tr>
            <th>Address</th>
            <th>Instruction</th>
          </tr>
        </thead>
        <tbody>
          {elements}
        </tbody>
      </table>
    </div>
  )
}