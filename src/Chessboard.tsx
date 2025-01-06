import {useRecoilState, useRecoilValue, useSetRecoilState} from "recoil";
import {BLOCK_PUT_LIST, BLOCK_PUT_TMP_LIST, SELELECT_ID} from "./App.tsx";
import {baseSize, Block} from "./Block.tsx";
import {getIndexRowCol} from "./utils.ts";

interface ChessboardProps {
    squares: number[][];
    onClick?: (rowIndex: number, colIndex: number) => void;
    onMouseOut?: (rowIndex: number, colIndex: number) => void;
    onMouseOver?: (rowIndex: number, colIndex: number) => void;
}

export function Chessboard({squares, onClick, onMouseOut, onMouseOver}: ChessboardProps) {
    const put_block_list = useRecoilValue(BLOCK_PUT_LIST)
    const set_put_block_list = useSetRecoilState(BLOCK_PUT_LIST)
    const set_select = useSetRecoilState(SELELECT_ID)
    const [tmpBlockStatus, setTmpBlockStatus] = useRecoilState(BLOCK_PUT_TMP_LIST)
    return (
        <>
            <div className="chessboard-grid" style={{width: baseSize * 8 + 4, height: baseSize * 8 + 4}}>
                {squares.map((row, rowIndex) =>
                    row.map((_, colIndex) => (
                        <div key={rowIndex + '-' + colIndex}
                             onClick={() => {
                                 console.log('click')
                                 if (onClick) {
                                     onClick(rowIndex, colIndex)
                                 }
                             }}
                             onMouseOut={() => {
                                 if (onMouseOut) {
                                     onMouseOut(rowIndex, colIndex)
                                 }
                             }}
                             onMouseOver={() => {
                                 console.log('onMouseOver')
                                 if (onMouseOver) {
                                     onMouseOver(rowIndex, colIndex)
                                 }
                             }}

                             className="chessboard-square gray-background"
                        >
                            <div className={"circle "}></div>
                        </div>
                    ))
                )}
            </div>
            {put_block_list.toArray().map(([id, state]) => {
                const pos = getIndexRowCol(state.index)
                return (<Block type={id}
                               onClick={() => {
                                   set_select(id)
                                   const v = put_block_list.get(id)
                                   if (v) {
                                       setTmpBlockStatus(tmpBlockStatus.set(id, v))
                                   }
                                   set_put_block_list(put_block_list.delete(id))

                               }}

                               left={pos.col * baseSize}
                               top={pos.row * baseSize}
                />)
            })}

            <div style={{position: 'absolute'}}>

            </div>

        </>
    );
}