import React, { ReactElement } from "react"

export const Registers = ({ registers, pc }: { registers: Int16Array, pc: number}): React.ReactElement => {

  const elements = new Array<ReactElement|null>(registers.length).fill(null);
  Array.from(registers).forEach((r: number, i: number) => (
   elements[i] =  (
      <div className="reg" key={i}>
        <span>R{i}:</span>
        <span>{r}</span>
      </div>
    )
  ));

  return (
    <div className="chip registers">
      <b>Registers</b>
      {
        elements
      }
      <div className="reg">
        <span>PC:</span>
        <span>{pc}</span>
      </div>
    </div>
  )
}