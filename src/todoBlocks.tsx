import {useRecoilState, useRecoilValue} from "recoil";
import {useEffect} from "react";
import {BlockType} from "./types.ts";
import {BLOCK_ID_DIR, BLOCK_Todo_LIST, BLOCK_Todo_Position, SELELECT_ID} from "./App.tsx";
import {baseSize, Block} from "./Block.tsx";
import {parseBlockType} from "./utils.ts";

export const id_todo_block_div = 'todo_block_div'

export function LayoutBlocks() {
    const [select, set_select] = useRecoilState(SELELECT_ID)
    //BLOCK_ID_LIST
    const blockStatus = useRecoilValue(BLOCK_Todo_LIST)
    const [blockDir, setBlockDir] = useRecoilState(BLOCK_ID_DIR)
    const [block_todo_position, set_block_todo_position] = useRecoilState(BLOCK_Todo_Position)


    useEffect(() => {
        let left = 0;
        let top = 0;
        let basetop = 0;
        let pre: BlockType;
        let current_pos = block_todo_position
        blockStatus.forEach((v) => {
            if (pre) {
                const info = parseBlockType(pre)
                left += info.width * baseSize
                // new line
                if (left > 600) {
                    left = 0
                    top += basetop
                    basetop = 0
                }
                basetop = Math.max(basetop, info.height * baseSize)
            }
            if (!current_pos.get(v)) {
                current_pos = current_pos.set(v, {left, top})
            }

            pre = v


        })
        set_block_todo_position(current_pos)
    }, [blockStatus])

    return (
        <div id={id_todo_block_div} style={{width: 800, height: 800, position: "relative"}}>

            {Array.from(blockStatus).map((v) => {

                const pos = block_todo_position.get(v)

                return (<div key={v} style={{float: 'left'}}>
                    <Block

                        top={pos?.top}
                        left={pos?.left}
                        onContextMenu={() => {
                            if (select === v) {
                                const dir = blockDir.get(v)
                                const newDir = dir != 'row' ? 'row' : 'col'
                                setBlockDir(blockDir.set(v, newDir))
                            }
                        }}
                        onClick={() => {
                            set_select(v)
                        }}
                        selected={v === select}
                        type={v}

                    ></Block>
                </div>)
            })}


        </div>
    )
}