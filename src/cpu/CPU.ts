import { ALUError } from "./ALUError";
import { CPUError } from "./CPUError";
import { Instruction } from "./Instruction";
import { signExtend } from "./signExtend";

export class CPU {
  public programCounter: number = 0;
  public registers: Int16Array = new Int16Array(0x8).fill(0);
  public memory: Int16Array = new Int16Array(0x4000).fill(0);
  public screen: Int16Array = new Int16Array(0x2000).fill(0);
  public screenChanges: number[] = [];
  public keyboard: Int16Array = new Int16Array(0x1).fill(0);
  public rom: Uint16Array = new Uint16Array(0x8000).fill(0);
  public screenElement: HTMLCanvasElement | null = null;
  public timestamp: number = 0;
  public frequency: number = parseInt(window.localStorage.getItem('frequency') || '8192');
  public rerenderUI: (() => void) | null = null;
  public running: boolean = false;

  public constructor() {
    // Initialize the stack pointer to the top of the stack
    this.registers[6] = 0x3FFF;
  }

  public setScreenElement(screenElement: HTMLCanvasElement): void {
    this.screenElement = screenElement;
  }

  public setRerenderDispatcher(rerenderUI: () => void): void {
    this.rerenderUI = rerenderUI;
  }

  public loadRom(fileText: string): void {
    const lines = fileText.split('\n');
    const words = lines[1].replace(/00: /g, '').split(' ').map((b) => parseInt(b, 16));
    if (words.length > this.rom.length) {
      throw new Error("ROM too large");
    }
    // convert bytes to words
    for(let i: number = 0; i < words.length; i++) {
      this.rom[i] = words[i];
    }
    this.rerenderUI?.(); // for react
  }

  public loadRam(fileText: string): void {
    const lines = fileText.split('\n');
    const words = lines[1].replace(/00: /g, '').split(' ').map((b) => parseInt(b, 16));
    if (words.length > this.memory.length) {
      throw new Error("ROM too large");
    }
    // convert bytes to words
    for(let i: number = 0; i < words.length; i++) {
      this.memory[i] = words[i];
    }
    this.rerenderUI?.(); // for react
  }

  public setRomValue(index: number, value: number): void {
    this.rom[index] = value;
    this.rerenderUI?.(); // for react
  }

  public setRamValue(index: number, value: number): void {
    this.memory[index] = value;
    this.rerenderUI?.(); // for react
  }

  public setKeyboardValue(value: number): void {
    this.keyboard[0] = value;
    this.rerenderUI?.(); // for react
  }

  public changeFrequency(frequency: number) {
    this.frequency = frequency;
    window.localStorage.setItem('frequency', frequency.toString());
    this.rerenderUI?.(); // for react
  }

  public stop(): void {
    this.running = false;
  }

  public run(): void {
    this.running = true;
    this.timestamp = 0;
    requestAnimationFrame((ts) => this.loop(ts));
  }

  public reset(): void {
    this.programCounter = 0;
    this.memory.fill(0);
    this.registers.fill(0);
    this.registers[6] = 0x3FFF;
    this.running = false;
    this.rerenderUI?.(); // for react
  }

  public next(): void {
    this.loop(0, true);
  }

  private loop(ts: number, runOnce: boolean = false): void {
    let instructionCount = 1;
    if (!runOnce) {
      if(!this.running) {
        return;
      }

      if(this.timestamp === 0) {
        this.timestamp = ts;
        requestAnimationFrame((ts) => this.loop(ts));
        return;
      }
      const delta = (ts - this.timestamp) / 1000;
      instructionCount = Math.floor(this.frequency * delta);
      if(instructionCount === 0) {
        requestAnimationFrame((ts) => this.loop(ts));
        return;
      }
      this.timestamp = ts;
    }


    for(let i: number = 0; i < instructionCount; i++) {
      const instruction: number = this.rom[this.programCounter];
      const decodedInstruction = new Instruction(instruction);
      if (instruction === 0) {
        this.rerenderUI?.(); // for react
        this.running = false;
        return;
      }
      switch(decodedInstruction.op) {
        case 0x0:
          this.alu(decodedInstruction);
          break;
        case 0x1:
          this.loadWord(decodedInstruction);
          break;
        case 0x2:
          this.storeword(decodedInstruction);
          break;
        case 0x3:
          this.branchOnEqual(decodedInstruction);
          break;
        case 0x4:
          this.jump(decodedInstruction);
          break;
        case 0x5:
          this.addImmediate(decodedInstruction);
          break;
        case 0x6:
          this.branchOnNotEqual(decodedInstruction);
          break;
        case 0x7:
          this.jumpRegister(decodedInstruction);
          break;
        case 0x8:
          this.jumpAndLink(decodedInstruction);
          break;
        case 0xf:
          this.display();
          break;
        default:
          throw new CPUError(decodedInstruction);
      }
      this.programCounter++;
    }
    this.rerenderUI?.(); // for react




    // Request the next frame
    requestAnimationFrame((ts) => this.loop(ts));
  }


  private alu(instruction: Instruction) {
    switch(instruction.funct) {
      case 0x0:
        this.and(instruction);
        break;
      case 0x1:
        this.or(instruction);
        break;
      case 0x2:
        this.add(instruction);
        break;
      case 0x6:
        this.subtract(instruction);
        break;
      case 0x7:
        this.setLessThan(instruction);
        break;
      default:
        throw new ALUError(instruction);
    }
  }

  private add(instruction: Instruction) {
    this.registers[instruction.rd] = this.registers[instruction.rs] + this.registers[instruction.rt];
  }

  private subtract(instruction: Instruction) {
    this.registers[instruction.rd] = this.registers[instruction.rs] - this.registers[instruction.rt];
  }

  private and(instruction: Instruction) {
    this.registers[instruction.rd] = this.registers[instruction.rs] & this.registers[instruction.rt];
  }

  private or(instruction: Instruction) {
    this.registers[instruction.rd] = this.registers[instruction.rs] | this.registers[instruction.rt];
  }

  private setLessThan(instruction: Instruction) {
    this.registers[instruction.rd] = this.registers[instruction.rs] < this.registers[instruction.rt] ? 1 : 0;
  }

  private loadWord(instruction: Instruction) {
    const address = this.registers[instruction.rs] + signExtend(instruction.immediate)
    if (address < 0x4000) {
      this.registers[instruction.rt] = this.memory[address];
    } else if (address < 0x6000) {
      this.registers[instruction.rt] = this.screen[address - 0x4000];
    } else if (address < 0x6001) {
      this.registers[instruction.rt] = this.keyboard[address - 0x6000];
    }
  }

  private storeword(instruction: Instruction) {
    // handle screen and keyboard
    const address = this.registers[instruction.rs] + signExtend(instruction.immediate)
    if (address < 0x4000) {
      this.memory[address] = this.registers[instruction.rt];
    } else if (address < 0x6000) {
      this.screen[address - 0x4000] = this.registers[instruction.rt];
      this.screenChanges.push(address - 0x4000);
    }
  }

  private branchOnEqual(instruction: Instruction) {
    if(this.registers[instruction.rs] === this.registers[instruction.rt]) {
      this.programCounter += signExtend(instruction.immediate);
    }
  }


  private jump(instruction: Instruction) {
    // replace the lower 12 bits of the program counter with the address
    this.programCounter = ((this.programCounter & parseInt('1111000000000000', 2)) | instruction.address) - 1;
  }

  private branchOnNotEqual(instruction: Instruction) {
    if(this.registers[instruction.rs] !== this.registers[instruction.rt]) {
      this.programCounter += signExtend(instruction.immediate);
    }
  }

  private addImmediate(instruction: Instruction) {
    this.registers[instruction.rt] = this.registers[instruction.rs] + signExtend(instruction.immediate);
  }

  private jumpRegister(instruction: Instruction) {
    this.programCounter = this.registers[instruction.rs];
  }

  private jumpAndLink(instruction: Instruction) {
    this.registers[7] = this.programCounter;
    this.programCounter = ((this.programCounter & parseInt('1111000000000000', 2)) | instruction.address) - 1;
  }

  private display() {
    // todo impmement display
    const context = this.screenElement?.getContext('2d');
    if (!context) {
      return;
    }
    const width = 128;
    const height = 64;

    const pixelWidth = this.screenElement!.width / width;
    const pixelHeight = this.screenElement!.height / height;
    for (let i = 0; i < this.screenChanges.length; i++) {
      const address = this.screenChanges[i];
      const x = address % width;
      const y = Math.floor(address / width);
      context.fillStyle = this.getRGBColor(this.screen[address]);
      context.fillRect(x * pixelWidth, y * pixelHeight, pixelWidth, pixelHeight);
    }
    this.screenChanges = [];
  }

  // gets rgb color from a 16 bit value (5 bits red, 6 bits green, 5 bits blue)
  private getRGBColor(value: number): string {
    const red = (value & parseInt('1111100000000000', 2)) >> 11;
    const green = (value & parseInt('0000011111100000', 2)) >> 5;
    const blue = (value & parseInt('0000000000011111', 2));
    return `rgb(${red * 8}, ${green * 4}, ${blue * 8})`;
  }
}