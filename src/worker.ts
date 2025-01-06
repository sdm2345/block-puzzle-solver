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

type BoardType = string[]; // using native array for board representation

interface Context {
    count: number
}

self.onmessage = (event) => {
    const { taskId, data } = event.data;
    const ctx: Context = {
        count: 0,
    }

    const req = data as BlockState;

    req.items = req.items.map((v) => {
        v.item.dir = v.item.dir || 'row';
        return v;
    });

    // Calculate the result
    const result = calc(req, ctx);
    self.postMessage({ taskId, action: 'done', data: result });
};

function calc(data: BlockState, ctx: Context): BlockState {
    const all = new Set<BlockType>(defaultBlocks);
    const type_list = data.items.map((v) => v.item.type);
    const type_left_set = new Set([...all].filter(x => !type_list.includes(x)));

    // Sort remaining blocks by size (larger blocks first)
    const sorted_left_items = Array.from(type_left_set).sort((a, b) => getBlockSize(b) - getBlockSize(a));

    const items = data.items;
    const board_state = create_board_state(items);

    const ret = search(board_state, items, sorted_left_items, 0, ctx);
    return {
        items: ret || [],
    }
}

function create_board_state(data: BlockItem[]): BoardType {
    const board_state = new Array(64).fill('');
    return fill_board_state(board_state, data);
}

function fill_board_state(board_state: BoardType, data: BlockItem[]): BoardType {
    for (let i = 0; i < data.length; i++) {
        const v = data[i];
        if (v) {
            if (v.index >= 64) {
                throw new Error(`index(${v.index}) is error, too large`);
            }
            const range = type_to_range(v);
            if (!can_place_here(board_state, range)) {
                throw new Error(`Cannot place block ${v.item.type} at index ${v.index}`);
            }
            put_block_here(board_state, range, v.item.type);
        }
    }
    return board_state;
}

interface Range {
    row: number
    col: number
    width: number
    height: number
}

function put_block_here(board_state: BoardType, range: Range, block: BlockType) {
    for (let row = range.row; row < range.row + range.height; row++) {
        for (let col = range.col; col < range.col + range.width; col++) {
            const index = (row << 3) + col;
            board_state[index] = block;
        }
    }
}

function can_place_here(board_state: BoardType, range: Range): boolean {
    if (range.row + range.height > 8 || range.col + range.width > 8) {
        return false;
    }
    for (let row = range.row; row < range.row + range.height; row++) {
        for (let col = range.col; col < range.col + range.width; col++) {
            const index = (row << 3) + col;
            if (board_state[index]) {
                return false;
            }
        }
    }
    return true;
}

function type_to_range(v: BlockItem): Range {
    const info = parseBlockType(v.item.type);
    const dir = v.item.dir || 'row';
    const width = dir == 'row' ? info.width : info.height;
    const height = dir == 'row' ? info.height : info.width;
    const pos = getIndexRowCol(v.index);
    return { width, height, row: pos.row, col: pos.col };
}

function getPossibleDirections(blockType: BlockType): BlockDirType[] {
    const info = parseBlockType(blockType);
    if (info.width === info.height) {
        return ['row']; // Square blocks need only one orientation
    }
    return ['row', 'col'];
}

function getBlockSize(blockType: BlockType): number {
    const info = parseBlockType(blockType);
    return info.width * info.height;
}

function search(board_state: BoardType, data: BlockItem[], left_items: BlockType[], depth: number, ctx: Context): (BlockItem[] | undefined) {
    if (left_items.length === 0) {
        return data;
    }

    for (let index = 0; index < 64; index++) {
        if (board_state[index]) {
            continue;
        }

        const position = getIndexRowCol(index);
        for (let i = 0; i < left_items.length; i++) {
            const current = left_items[i];

            for (let dir_item of getPossibleDirections(current)) {
                const new_block_item: BlockItem = {
                    item: { type: current, dir: dir_item },
                    index: index,
                };

                const range = type_to_range(new_block_item);
                if (!can_place_here(board_state, range)) {
                    continue;
                }

                // Prepare new state
                const new_board_state = board_state.slice();
                const new_data = data.slice();
                const new_left_items = left_items.slice();
                new_left_items.splice(i, 1); // remove current block

                put_block_here(new_board_state, range, current);
                new_data.push(new_block_item);

                ctx.count++;
                if (ctx.count % 1000 === 0) { // Adjust the frequency as needed
                    self.postMessage({ action: "count", count: ctx.count });
                }

                const ret = search(new_board_state, new_data, new_left_items, depth + 1, ctx);
                if (ret && ret.length > 0) {
                    return ret;
                }
            }
        }
    }
    return undefined;
}

function parseBlockType(s: string): BlockSizeColor {
    const [size, color] = s.split(':');
    const [width, height] = size.split('x').map((v) => parseInt(v));
    return { width, height, color, dir: 'row' };
}

function getIndexRowCol(pos: PositionIndex): RowCol {
    return {
        row: pos >> 3,
        col: pos % 8,
    }
}

console.log('Worker loaded and ready.');
