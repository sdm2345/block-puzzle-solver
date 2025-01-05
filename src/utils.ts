import {BlockDirType, BlockSizeColor, BlockType, Position, PositionIndex, RowCol, TypeId} from "./types.ts";
import {baseSize} from "./Block.tsx";

export function showBoardState(arr: Array<BlockType>) {
    const tmp: string[] = []
    for (let i = 0; i < arr.length; i++) {
        const v = (TypeId[arr[i]] || '.') as string
        if ((i & 0b111) == 0) {
            tmp.push("\n")
        }
        tmp.push(v + '')

    }
    return tmp.join('')
}

const cache: Record<string, BlockSizeColor> = {}

export function parseBlockType(s: string): BlockSizeColor {
    if (cache[s]) {
        return cache[s] as BlockSizeColor
    }
    const [size, color, dirs] = s.split(':')

    const [ height,width] = size.split('x').map((v) => parseInt(v))

    const dir = dirs as BlockDirType
    cache[s] = {width, height, color, dir}
    return cache[s]
}


export function InfoToType(info: BlockSizeColor): BlockType {
    return `${info.width}x${info.height}:${info.color}:${info.dir}` as BlockType
}

export function positionToIndex(pos: Position): PositionIndex {
    const col = Math.ceil(pos.left / baseSize)
    const row = Math.ceil(pos.top / baseSize)
    return (row * 8 + col) as PositionIndex
}


export function getRowCol(pos: Position): RowCol {
    return {
        row: Math.ceil(pos.top / baseSize),
        col: Math.ceil(pos.left / baseSize),
    }
}

export function getIndexRowCol(pos: PositionIndex): RowCol {
    return {
        row: pos >> 3,
        col: pos % 8,
    }
}

export function isOut(pos: Position) {
    const {row, col} = getRowCol(pos)
    return row > 7 || col > 7

}

export function isOutGrid(pos: RowCol) {
    const {row, col} = pos
    // kinds
    return row > 7 || col > 7

}

