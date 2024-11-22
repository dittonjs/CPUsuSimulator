import { ChangeEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { CPU } from './cpu/CPU'
import { Registers } from './Registers';
import { DataChip } from './DataChip';
import { DecompiledProgram } from './DecompiledProgram';

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cpu = useMemo<CPU>(() => new CPU(), [])
  const [toggle, setToggle] = useState<number>(0);
  const [serverMode, setServerMode] = useState<boolean>(window.localStorage.getItem('serverMode') === 'true');
  const [hostname, setHostName] = useState<string>(window.localStorage.getItem('hostname') || 'localhost');
  const [port, setPort] = useState<string>(window.localStorage.getItem("port") || "8000");
  const [rom, setRom] = useState<string>(window.localStorage.getItem('rom') || 'program_rom.hex');
  const [ram, setRam] = useState<string>(window.localStorage.getItem('ram') || 'program_ram.hex');



  useEffect(() => {
    if (canvasRef.current) {
      cpu.setScreenElement(canvasRef.current!);
    }
  }, [cpu]);

  // supplies state change callback to CPU to trigger UI update each render frame.
  useEffect(() => {
    cpu.setRerenderDispatcher(() => setToggle(t => t+1));
  }, [toggle, cpu]);

  useEffect(() => {
    window.localStorage.setItem('serverMode', serverMode.toString());
    window.localStorage.setItem('hostname', hostname);
    window.localStorage.setItem('port', port);
    window.localStorage.setItem('rom', rom);
    window.localStorage.setItem('ram', ram);
    if (serverMode) {
      cpu.startServerMode(hostname, port, rom, ram);
    } else {
      cpu.stopServerMode();
    }
  }, [serverMode, port, rom, ram, hostname, cpu]);

  function loadRomFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.item(0);

    file?.text().then((text) => {
      cpu.loadRom(text);
    });
  }

  function loadRamFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.item(0);

    file?.text().then((text) => {
      cpu.loadRam(text);
    });
  }

  const keydown = (e: KeyboardEvent) => {
    switch(e.key) {
      case "ArrowUp":
        cpu.setKeyboardValue(38);
        break;
      case "ArrowLeft":
        cpu.setKeyboardValue(37);
        break;
      case "ArrowDown":
        cpu.setKeyboardValue(40);
        break;
      case "ArrowRight":
        cpu.setKeyboardValue(39);
        break;
      case "Enter":
        cpu.setKeyboardValue(10);
        break;
      default:
        cpu.setKeyboardValue(e.key.toUpperCase().charCodeAt(0));

        break;
    }
  }

  const keyup = () => {
    cpu.setKeyboardValue(0);
  }

  return (
    <div className='container'>
      <div className='controls'>
        <div>
          <div>
            Server Mode <input type="checkbox" checked={serverMode} onChange={e => setServerMode(e.target.checked)} />
          </div>

          {!serverMode && <>
            <div>
              ROM file:&nbsp;
              <input type="file" onChange={loadRomFile}/>
            </div>
            <div>
              RAM file:&nbsp;
              <input type="file" onChange={loadRamFile}/>
            </div>
          </>}

          {serverMode && <div>
            <div>Hostname: <input type="text" value={hostname} onChange={e => setHostName(e.target.value)}/></div>
            <div>Port: <input type="text" value={port} onChange={e => setPort(e.target.value)}/></div>
            <div>ROM file: <input type="text" value={rom} onChange={e => setRom(e.target.value)}/></div>
            <div>RAM file: <input type="text" value={ram} onChange={e => setRam(e.target.value)}/></div>
          </div>}
        </div>
        <div>
          <button onClick={() => {
            document.body.focus();
            cpu.run();
          }}>Start</button>
          <button onClick={() => cpu.stop()}>Stop</button>
          <button onClick={() => cpu.reset()}>Reset</button>
          <button onClick={() => cpu.next()}>Next Instruction</button>
        </div>
        <div>
          Frequency
          <select value={cpu.frequency} onChange={e => cpu.changeFrequency(parseInt(e.target.value))}>
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={4}>4</option>
            <option value={8}>8</option>
            <option value={16}>16</option>
            <option value={32}>32</option>
            <option value={64}>64</option>
            <option value={128}>128</option>
            <option value={256}>256</option>
            <option value={512}>512</option>
            <option value={1024}>1k</option>
            <option value={2048}>2k</option>
            <option value={4096}>4k</option>
            <option value={8192}>8k</option>
            <option value={16384}>16k</option>
            <option value={32768}>32k</option>
            <option value={65536}>64k</option>
            <option value={131072}>128k</option>
          </select>Hz
        </div>
      </div>
      <div className='screen'>
        <canvas ref={canvasRef} className="screenElement" width={768} height={384}></canvas>
        Focus this input to use the keyboard <input type="text" value="" onKeyDown={keydown} onKeyUp={keyup} onBlur={keyup}/>
      </div>
      <div className='cpu'>
        <DataChip shouldHighlight data={cpu.rom} title="ROM (32k)" highlightIndex={cpu.programCounter} setCPUValue={(i: number, v: number) => cpu.setRomValue(i, v)}/>
        <DataChip data={cpu.memory} title="RAM (16k)" highlightIndex={0} setCPUValue={(i: number, v: number) => cpu.setRamValue(i, v)}/>
        <div className='code'>
          <DecompiledProgram rom={cpu.rom} highlightIndex={cpu.programCounter}/>
        </div>
        <Registers registers={cpu.registers} pc={cpu.programCounter}/>
      </div>
      <div className="usage">
        <h2>Usage</h2>
        <ul>
          <li>Set the frequency of the CPU</li>
          <li>Choose the ROM and RAM files to load</li>
          <li>Click "Start" to run the program</li>
          <li>Click "Stop" to pause the program</li>
          <li>Click "Reset" to reset the CPU</li>
          <li>Click "Next Instruction" to step through the program one instruction at a time</li>
        </ul>
        <h2>Server Mode</h2>
        <p>Server mode will connect to a server and request the
          the ROM and RAM files dynamically instead of having to reupload everytime you change your
          program. When the app detects that the requested rom/ram files have changed, it will reset
          the simulation and load the new files into the ROM and RAM.
          This means you can just compile and run!
        </p>
        <div>
          The server has a few requirements:
          <ol>
            <li>It must have cors enabled</li>
            <li>The cache must be disabled. Otherwise it will continue to load old versions until the cache expires</li>
          </ol>
          If you have NodeJS installed you can run the following command to get that for free:&nbsp;
          <code>npx http-server --cors -p 8000 -c-1</code>
        </div>
        <h2>Compatibility</h2>
        <h3>Keyboard</h3>
        <ul>
          <li>ASCII values 0x32 - 0x96 should work the same as the logisim keyboard</li>
          <li>The "Enter" key and arrow keys will also work</li>
          <li>Other codes might work but milage may vary.</li>
        </ul>
        <h3>Screen</h3>
        <ul>
          <li>To improve performance, the <code>display</code> command only redraws pixes that have changed in memory
          since the last draw. This shouldn't cause issues, but all of the edge cases have not be tested yet.</li>
        </ul>
      </div>
      <h2>Known Issues</h2>
      <ul>
        <li>Screen doesn't clear when CPU is reset</li>
        <li>App crashes if you set the range on RAM and ROM too large</li>
        <li>Uploading the same file multiple times in a row will not trigger UI refresh and load new values into ROM/RAM. As workaround, you can just refresh browser. Will fix soon :)</li>
      </ul>
      <div>Source Code</div>
      <div><a href="https://github.com/dittonjs/CPUsuSimulator">Github</a></div>
    </div>
  )
}

export default App
