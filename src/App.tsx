import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { CPU } from './cpu/CPU'
import { Registers } from './Registers';
import { DataChip } from './DataChip';
import { DecompiledProgram } from './DecompiledProgram';

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cpu = useMemo<CPU>(() => new CPU(), [])
  const [toggle, setToggle] = useState<boolean>(false);
  const [serverMode, setServerMode] = useState<boolean>(window.localStorage.getItem('serverMode') === 'true');
  const [hostname, setHostName] = useState<string>(window.localStorage.getItem('hostname') || 'localhost');
  const [port, setPort] = useState<string>(window.localStorage.getItem("port") || "8000");
  const [rom, setRom] = useState<string>(window.localStorage.getItem('rom') || 'program_rom.hex');
  const [ram, setRam] = useState<string>(window.localStorage.getItem('ram') || 'program_ram.hex');

  useEffect(() => {
    window.localStorage.setItem('serverMode', serverMode.toString());
    window.localStorage.setItem('hostname', hostname);
    window.localStorage.setItem('port', port);
    window.localStorage.setItem('rom', rom);
    window.localStorage.setItem('ram', ram);
  }, [serverMode, port, rom, ram, hostname]);

  useEffect(() => {
    if (canvasRef.current) {
      cpu.setScreenElement(canvasRef.current!);
    }
    // cpu.run();
  }, [cpu]);

  // supplies state change callback to CPU to trigger UI update each render frame.
  useEffect(() => {
    cpu.setRerenderDispatcher(() => setToggle(t => !t));
  }, [toggle, cpu]);

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
          <p>Coming soon!</p>
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

    </div>
  )
}

export default App
