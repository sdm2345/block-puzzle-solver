// App.tsx
import './App.css';
import './Chessboard.css';
import {atom, useRecoilState, useRecoilValue, useSetRecoilState} from "recoil";
import {
    BlockDirType,
    BlockItem,
    BlockState,
    BlockType,
    defaultBlocks,
    Position,
    PositionIndex,
    RowCol
} from "./types.ts";
import {List, Map} from "immutable";
import {useEffect, useState} from "react";
import {id_todo_block_div, LayoutBlocks} from "./todoBlocks.tsx";
import {getIndexRowCol, isOutGrid, parseBlockType, positionToIndex} from "./utils.ts";
import {Chessboard} from "./Chessboard.tsx";
import {baseSize, Block} from "./Block.tsx";


export const SELELECT_ID = atom<BlockType | undefined>({
    key: 'SELELECT_ID', // 必须唯一的字符串，标识该状态
    default: undefined, // 状态的初始值
});


export const BLOCK_Todo_LIST = atom<List<BlockType>>({
    key: 'BLOCK_ID_LIST', //
    default: List(defaultBlocks), // 状态的初始值
});

export const BLOCK_Todo_Position = atom<Map<BlockType, Position>>({
    key: 'BLOCK_Todo_Position', //
    default: Map({}), // 状态的初始值
});

interface PutBlockState {
    index: PositionIndex
    dir?: 'row' | 'col'
}

export const BLOCK_PUT_LIST = atom<Map<BlockType, PutBlockState>>({
    key: 'BLOCK_PUT_LIST', //
    default: Map(), // 状态的初始值
});

export const BLOCK_PUT_TMP_LIST = atom<Map<BlockType, PutBlockState>>({
    key: 'BLOCK_PUT_TMP_LIST', //
    default: Map(), // 状态的初始值
});

export const MaxZindex = atom({
    key: 'MaxZindex', //
    default: 1, // 状态的初始值
});

export const BLOCK_ID_DIR = atom<Map<BlockType, BlockDirType>>({
    key: 'BLOCK_ID_DIR', //
    default: Map({}), // 状态的初始值
});

export const BLOCK_ZIndex = atom<Map<BlockType, number>>({
    key: 'BLOCK_ZIndex', //
    default: Map(), // 状态的初始值
});

const defaultChessboardState: BlockType[] = [
    '', '', '', '', '', '', '', '',
    '', '', '', '', '', '', '', '',
    '', '', '', '', '', '', '', '',
    '', '', '', '', '', '', '', '',
    '', '', '', '', '', '', '', '',
    '', '', '', '', '', '', '', '',
    '', '', '', '', '', '', '', '',
    '', '', '', '', '', '', '', '',
]

export const ChessboardState = atom<List<BlockType>>({
    key: 'blockStatus', //
    default: List(defaultChessboardState), // 状态的初始值
});


declare const Worker: new (scriptUrl: URL, options?: WorkerOptions) => Worker;


function App() {

    const maxZIndex = useRecoilValue(MaxZindex)

    // current pos
    const [pos, setPos] = useState<Position>({top: 0, left: 0})
    const [realPos, setRealPos] = useState<Position>({top: 0, left: 0})
    const [canPut, setCanPut] = useState(false)
    //const [canPutReason, setCanPutReason] = useState('')
    const [boardState, setBoardState] = useRecoilState(ChessboardState)
    const [select, set_select] = useRecoilState(SELELECT_ID)
    const [put_block, set_put_block] = useRecoilState(BLOCK_PUT_LIST)

    const check_position = (pos: Position) => {
        const current_col = Math.ceil(pos.left / baseSize)
        const current_row = Math.ceil(pos.top / baseSize)

        setRealPos({
            left: current_col * baseSize,
            top: current_row * baseSize,
        })
        if (select) {

            const info = parseBlockType(select)

            const dir = blockDir.get(select) || 'row'
            const [w, h] = dir == 'row' ? [info.width, info.height] : [info.height, info.width]


            for (let row = current_row; row < h + current_row; row++) {
                for (let col = current_col; col < w + current_col; col++) {
                    if (boardState.get(row * 8 + col)) {
                        setCanPut(false)
                        console.log(JSON.stringify([
                            'row * 8 + col' + boardState.get(row * 8 + col),
                            {row, col},
                            {'row * 8 + col': row * 8 + col}

                        ]))
                        return
                    }
                    if (row > 7 || col > 7) {
                        // console.log('row > 7 || col > 7', row > 7, '||', col > 7, row, col)
                        setCanPut(false)
                        console.log(JSON.stringify(['row > 7 || col > 7', row > 7, '||', col > 7, row, col]))
                        return
                    }
                }
            }
            setCanPut(true)
        }

    }

    useEffect(() => {
        let current_board = List(defaultChessboardState)

        put_block.forEach((v, id) => {
            const row_col = getIndexRowCol(v.index)
            const info = parseBlockType(id)
            const dir = blockDir.get(id) || 'row'
            const [w, h] = dir == 'row' ? [info.width, info.height] : [info.height, info.width]

            for (let row = row_col.row; row < h + row_col.row; row++) {
                for (let col = row_col.col; col < w + row_col.col; col++) {
                    console.log('set ', row + ',' + col, id)
                    console.log('typeof', current_board)
                    current_board = current_board.set(row * 8 + col, id)
                }
            }
        })
        setBoardState(current_board)
        console.log('boardState', boardState)
    }, [put_block])

    const todoBlockStatus = useRecoilValue(BLOCK_Todo_LIST)
    const setTodoBlockStatus = useSetRecoilState(BLOCK_Todo_LIST)
    const [tmpBlockStatus, setTmpBlockStatus] = useRecoilState(BLOCK_PUT_TMP_LIST)

    const [block_todo_position, set_block_todo_position] = useRecoilState(BLOCK_Todo_Position)

    const [blockDir, setBlockDir] = useRecoilState(BLOCK_ID_DIR)

    const [resultStep, setResultStep] = useState<BlockItem[]>([])
    const [count, set_count] = useState(0)
    // console.log('blockDir', blockDir.toJS())
    // console.log('block_todo_position', block_todo_position.toJS())


    const putBlock = (id: BlockType, index: PositionIndex) => {

        const point: RowCol = {
            row: index >> 3,
            col: index & 0b111,
        }
        console.log('putBlock', id, 'canPut', canPut, index, point, 'pos', pos)

        if (!canPut) {
            if (isOutGrid(point)) {
                console.log('is out', select, pos, isOutGrid(point))

                if (select) {
                    // offset parent id
                    const div = document.getElementById(id_todo_block_div)
                    if (div) {
                        set_block_todo_position(block_todo_position.set(select, {
                            left: pos.left - div.offsetLeft,
                            top: pos.top - div.offsetTop,
                        }))
                    }

                    setTodoBlockStatus(todoBlockStatus.push(select))
                }
            } else {
                // tmp_put_list to put_list
                tmpBlockStatus.forEach((v, k) => {
                    set_put_block(put_block.set(k, v))
                })

                setTmpBlockStatus(Map())
            }

            return
        }
        const dirInfo = blockDir.get(id)
        const current = put_block.set(id, {
            index: index,
            dir: dirInfo,
        })


        set_put_block(current)

        // remove const todoBlockStatus = useRecoilValue(BLOCK_ID_LIST)
        setTodoBlockStatus(todoBlockStatus.filter((v) => {
            return v != id
        }))
    }
    const put_block_list = useRecoilValue(BLOCK_PUT_LIST)

    const [worker, set_worker] = useState<Worker | undefined>()

    function stop_worker() {
        if (worker) {
            worker.terminate()
        }
    }

    function run_worker() {
        console.log('try to loader worker')
        set_count(0)
        const worker = new Worker(new URL('./worker.ts', import.meta.url,), {type: 'module'});
        set_worker(worker)
        // 发送任务到 Worker
        const req: BlockState = {
            items: []
        }
        put_block_list.forEach((v, k) => {
            req.items.push({
                item: {
                    type: k,
                    dir: v.dir || 'row',
                },
                index: v.index
            })
        })
        console.log('req data', JSON.stringify(req))
        worker.postMessage({
            taskId: 'calc',
            data: req,
        });

        worker.onmessage = (msg: MessageEvent) => {
            console.log('get result', msg.data.data)
            if (msg.data.action == 'count') {
                set_count(msg.data.count)
                return
            }

            worker.terminate()
            const result = msg.data.data as BlockState
            console.log('result', result)
            setResultStep(result.items)

        }
        console.log('start worker ok')
    }

    async function start_to_demo() {
        if (resultStep.length > 0) {

            let blockDir2 = blockDir
            let put_block2 = put_block
            for (let i = 0; i < resultStep.length; i++) {
                const item = resultStep[i]
                blockDir2 = blockDir2.set(item.item.type, item.item.dir)
                put_block2 = put_block2.set(item.item.type, {
                    index: item.index,
                    dir: item.item.dir,
                })
            }

            set_put_block(put_block2)
            setBlockDir(blockDir2)

        }

    }

    return (
        <>
            <div
                onContextMenu={(e) => {
                    e.preventDefault(); // 阻止默认右键菜单
                    console.log('右键点击逻辑代码'); // 执行自定义逻辑
                    if (select) {
                        const dir = blockDir.get(select)
                        const newDir = dir != 'row' ? 'row' : 'col'
                        setBlockDir(blockDir.set(select, newDir))
                    }
                    return false
                }}
                onMouseMove={(e) => {

                    if (select) {
                        const e2 = e.nativeEvent as unknown as MouseEvent
                        const new_pos = {
                            top: Math.max(0, e2.y - 50),
                            left: Math.max(0, e2.x - 50)
                        }
                        setPos(new_pos)
                        check_position(new_pos)
                    }
                }} onClick={() => {
                console.log('click put')
                if (select) {
                    set_select('')
                    putBlock(select, positionToIndex(realPos))
                }
            }} style={{display: "flex", gap: "20px", position: "absolute"}}>
                <Chessboard
                    onClick={(x, y) => {
                        console.log('onClick', {x, y})
                    }}
                    squares={Array.from({length: 8}, () => Array(8).fill(0))}
                />
                <LayoutBlocks/>
                {select && (<Block
                    float={true}
                    zIndex={maxZIndex + 10}
                    top={pos.top}
                    left={pos.left}
                    type={select}></Block>)}

                {select && (<Block


                    float={true}
                    top={realPos.top}
                    left={realPos.left}
                    type={select}></Block>)}

                <div style={{
                    position: "absolute",
                    zIndex: -100,
                    width: 500,
                    right: 0
                }}>

                </div>

            </div>
            <div style={{position: 'absolute', display: "flex", borderSpacing: 2, bottom: 0, zIndex: 999}}>
                <button onClick={(e) => {
                    console.log('click but');
                    run_worker();
                    e.preventDefault()
                }}>start calc
                </button>
                <button disabled={resultStep.length == 0} onClick={async (e) => {

                    start_to_demo()
                    e.preventDefault()
                }}>fill
                </button>
                <button disabled={!worker} onClick={stop_worker}>stop</button>
                <span>search:{count}</span>

            </div>

        </>
    );
}


export default App;