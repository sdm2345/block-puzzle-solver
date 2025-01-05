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


