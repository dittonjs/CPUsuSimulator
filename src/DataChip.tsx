import { ReactElement, useState } from "react";

type DataChipProps = {
  data: ArrayLike<number>,
  title: string,
  highlightIndex: number,
  setCPUValue: (index: number, value: number) => void,
  shouldHighlight?: boolean
}

export const DataChip = ({data, title, highlightIndex, setCPUValue, shouldHighlight = false}: DataChipProps): ReactElement => {
  const [rowsStart, setRowsStart] = useState<number>(0);
  const [rowsEnd, setRowsEnd] = useState<number>(100);
  const [editingIndex, setEditingIndex] = useState<number>(-1);
  const elements = new Array<ReactElement | null>(Math.floor(data.length / 4)).fill(null);

  function setValueInCPU(value: string) {
    if(editingIndex === -1) {
      return;
    }
    const newValue = parseInt(value, 16);
    if(isNaN(newValue)) {
      return;
    }
    setCPUValue(editingIndex, newValue);
  }


  for(let i: number = rowsStart*4; i < rowsEnd*4; i+=4) {
    elements[Math.floor(i / 4)] = (
      <tr key={i}>
        <td>{i.toString(16).padStart(4, '0').toUpperCase()}</td>
        <td className={shouldHighlight && highlightIndex === i ? "highlight" : ""}>
          <input
            readOnly={editingIndex !== i}
            onFocus={() => {
              setEditingIndex(i)
            }}
            onChange={(e) => {
              setValueInCPU(e.target.value);
            }}
            value={data[i].toString(16).padStart(4, '0').toUpperCase()}
          />
        </td>
        <td className={shouldHighlight && highlightIndex === i+1 ? "highlight" : ""}>
          <input
            readOnly={editingIndex !== i+1}
            onFocus={() => {
              setEditingIndex(i+1)
            }}
            onChange={(e) => {
              setValueInCPU(e.target.value);
            }}
            value={data[i+1].toString(16).padStart(4, '0').toUpperCase()}
          />
        </td>
        <td className={shouldHighlight && highlightIndex === i+2 ? "highlight" : ""}>
          <input
            readOnly={editingIndex !== i+1}
            onFocus={() => {
              setEditingIndex(i+2)
            }}
            onChange={(e) => {
              setValueInCPU(e.target.value);
            }}
            value={data[i+2].toString(16).padStart(4, '0').toUpperCase()}
          />
        </td>
        <td className={shouldHighlight && highlightIndex === i+3 ? "highlight" : ""}>
          <input
            readOnly={editingIndex !== i+1}
            onFocus={() => {
              setEditingIndex(i+3)
            }}
            onChange={(e) => {
              setValueInCPU(e.target.value);
            }}
            value={data[i+3].toString(16).padStart(4, '0').toUpperCase()}
          />
        </td>
      </tr>
    )
  }



  return (
    <div className="chip">
      <div>
        <b>{title}</b>
      </div>
      <div className="rows">
        <div>Start <input type="number" value={rowsStart} onChange={(e) => setRowsStart(parseInt(e.target.value))}></input></div>
        <div>End <input type="number" value={rowsEnd} onChange={(e) => setRowsEnd(parseInt(e.target.value))}></input></div>
      </div>
      <table className="memory">
        <thead>
          <tr>
            <th>Addr</th>
            <th>0</th>
            <th>1</th>
            <th>2</th>
            <th>3</th>
          </tr>
        </thead>
        <tbody>
          {
            elements
          }
        </tbody>
      </table>
    </div>
  )
}