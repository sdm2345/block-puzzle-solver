我写一个拼图解密游戏的 破解程序的代码 现在 搜索速度非常慢 没有有效地剪枝
请帮我优化代码 接口保持 不变

后台计算代码:
worker.ts
```
// worker.ts
// worker.ts


import {
    BlockDirType,
    BlockItem,
    BlockSizeColor,
    BlockState,
    BlockType,
    defaultBlocks,
    PositionIndex,
    RowCol,
    TypeId
} from "./types.ts";

import {List, Set} from "immutable";

type   BoardType = List<BlockType>

interface Context {
    count:number
}

self.onmessage = (event) => {
    console.log('get message')
    const {taskId, data} = event.data;

    const ctx:Context = {
        count:0,
    }

    const req = data as BlockState

    req.items = req.items.map((v) => {
        v.item.dir = v.item.dir || 'row';
        return v
    })
    console.log('get request', req)

    // todo ctx
    // 返回结果
    self.postMessage({taskId, action: 'done', data: calc(req,ctx)});
};

function calc(data: BlockState,ctx:Context): BlockState {

    console.log('start to calc', data)
    const all = Set(defaultBlocks)
    const type_list = List(data.items.map((v) => v.item.type))
    const type_left = all.subtract(Set(type_list))

    const items = List(data.items)
    const board_state = create_board_state(items)

    console.log('init board:', debug_board(board_state))
    // throw new Error('STOP')

    const ret = search(board_state, items, type_left, 0,ctx)
    return {
        items: ret.toArray(),
    }
}

function create_board_state(data: List<BlockItem>) {
    const board_state = List<BlockType>(new Array(64).fill(''))
    return fill_board_state(board_state, data)
}

function fill_board_state(board_state: BoardType, data: List<BlockItem>): BoardType {
    console.log('fill board', data.size, data.toJSON())
    for (let i = 0; i < data.size; i++) {
        const v = data.get(i)
        console.log('fill board item', v, v?.item, v?.index)
        if (v) {
            if (v.index > 64) {
                throw new Error(`index(${v.index}) is error,to large`)
            }
            const range = type_to_range(v)
            console.log('range', JSON.stringify(range), 'item', JSON.stringify(v))
            if (!can_place_here(board_state, range)) {
                throw new Error(`can_place_here here,error board state: range:${JSON.stringify(range)} board_state:${debug_board(board_state)}`)
            }

            board_state = put_block_here(board_state, range, v.item.type)

        }
    }
    console.log('fill debug', debug_board(board_state))
    return board_state
}

interface Range {
    row: number
    col: number
    width: number
    height: number
}

function put_block_here(board_state: BoardType, range: Range, block: BlockType) {
    console.log('put_block_here', range)
    for (let row = range.row; row < range.row + range.height; row++) {
        for (let col = range.col; col < range.col + range.width; col++) {
            const index = (row << 3) + col
            if (index >= 64) {
                console.log('error range', range)
                return board_state
            }

            board_state = board_state.set(index, block)
        }
    }
    return board_state
}

function can_place_here(board_state: BoardType, range: Range) {

    if (range.row + range.height > 8) {
        return false
    }
    if (range.col + range.width > 8) {
        return false
    }

    for (let row = range.row; row < range.row + range.height; row++) {

        for (let col = range.col; col < range.col + range.width; col++) {

            const index = (row << 3) + col
            // console.log(`check row:${row}, col:${col}, range:${JSON.stringify(range)} index:${index}`)
            if (index > 64) {
                // console.log(`overflow index:${index},board_state:${board_state},range:${JSON.stringify(range)} `)
                return false
            }
            const v = board_state.get(index)
            if (v) {
                // console.log(`warn ${v} is not empty,board_state:${debug_board(board_state)},range:${JSON.stringify(range)} `)
                return false
            }
        }
    }
    return true
}

function type_to_range(v: BlockItem) {
    const info = parseBlockType(v.item.type)
    info.dir = v.item.dir
    // //console.log('type_to_range', v, info)

    const dir = v.item.dir || 'row'
    const [width, height] = dir == 'row' ? [info.width, info.height] : [info.height, info.width]
    const pos = getIndexRowCol(v.index)
    //console.log('type to range', v.index, 'pos', pos)
    return {
        width, height,
        row: pos.row,
        col: pos.col,
    }
}

function search(board_state: BoardType, data: List<BlockItem>, left_items: Set<BlockType>, depth: number,ctx:Context): (List<BlockItem> | undefined) {

    console.log('search', depth, debug_board(board_state), 'data', data.toJS(), 'left', left_items.toJS())


    if (left_items.size == 0) {
        console.log('search result data', data.toArray())
        return data
    }
    const arr = left_items.toArray()
    // search pos

    const board_state_arr = board_state.toArray()
    //console.log('board_state length', board_state.size)
    for (let index = 0; index < board_state_arr.length; index++) {
        if (board_state_arr[index]) {
            continue
        }

        // can put this place (row,col) ?
        for (let i = 0; i < arr.length; i++) {

            const current = arr[i]

            const new_left = left_items.remove(current)
            const dirs: BlockDirType[] = ['row', 'col']
            for (let d = 0; d < dirs.length; d++) {
                const current_board_state = List(board_state.toJS());
                const dir_item = dirs[d]

                const new_block_item: BlockItem = {
                    item: {
                        type: current,
                        dir: dir_item,
                    },
                    index,
                }


                const range = type_to_range(new_block_item)

                if (!can_place_here(board_state, range)) {

                    continue
                }

                ctx.count++
                self.postMessage({action:"count",count:ctx.count})
                console.log('select current', current, new_block_item)
                // try to put here
                const new_data = data.push(new_block_item)
                const new_board_state = put_block_here(current_board_state, range, current)
                const ret = search(new_board_state, new_data, new_left, depth + 1,ctx)
                if (ret && ret.size > 0) {
                    return ret
                }
                // search other

            }
        }
    }

    return undefined
}

function debug_board(board_state: BoardType) {
    const out: string[] = []
    const arr = board_state.toArray()
    for (let i = 0; i < arr.length; i++) {
        if ((i & 0b111) == 0) {
            out.push('\n')
        }
        out.push(arr[i] ? TypeId[arr[i]] : '.')

    }
    return ('debug:[\n' + out.join(' ') + '\n]')
}

const cache: Record<string, BlockSizeColor> = {}

export function parseBlockType(s: string): BlockSizeColor {
    if (cache[s]) {
        return cache[s] as BlockSizeColor
    }
    const [size, color, dirs] = s.split(':')

    const [height, width] = size.split('x').map((v) => parseInt(v))

    const dir = dirs as BlockDirType
    cache[s] = {width, height, color, dir}
    return cache[s]
}


export function getIndexRowCol(pos: PositionIndex): RowCol {
    return {
        row: pos >> 3,
        col: pos % 8,
    }
}

console.log('worker load ok')
```

types.ts
```
export type BlockDirType = 'row' | 'col'

export type BlockType = '1x1:gray' |
    '1x2:gray' |   /*
  x x
  */
    '1x3:gray' |
    '2x3:red' |
    '2x4:red' |
    '1x4:blue' |
    '1x5:blue' |

    '3x3:white' |
    '2x2:white' |
    '3x4:yellow' |
    /*
    *  x x x
    *  x x x
    *  x x x
    *  x x x
    * */
    '2x5:yellow' | ''

export const Empty: BlockType = ''

export interface BlockSizeColor {
    width: number
    height: number
    color: string
    dir: BlockDirType
}


export const TypeId: Record<string, string> = {

    '1x3:gray': '1',
    '1x1:gray': '2',
    '1x2:gray': '3',

    '1x5:blue': '4',
    '1x4:blue': '6',

    '3x4:yellow': '5',
    '2x5:yellow': 'B',

    '2x3:red': '7',
    '2x4:red': '8',

    '3x3:white': '9',
    '2x2:white': 'A',

}
export const defaultBlocks: BlockType[] = [

    '1x3:gray',
    '1x1:gray',
    '1x2:gray',

    '1x5:blue',
    '1x4:blue',

    '2x3:red',
    '2x4:red',

    '3x3:white',
    '2x2:white',

    '3x4:yellow',
    '2x5:yellow'
]

export interface BlockTypeItem {
    type: BlockType
    dir: BlockDirType
}

export interface RowCol {
    row: number
    col: number

}

export interface Position {
    top: number
    left: number
}

export type PositionIndex = number

export interface BlockItem {
    item: BlockTypeItem
    // row * 8 + col
    index:number
}


export interface BlockState {
    items: BlockItem[],
}



```
请优化 worker.ts 的代码