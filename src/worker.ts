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

self.onmessage = (event) => {
    console.log('Received message');
    const { taskId, data } = event.data;

    const ctx = {
        count: 0,
    };

    const req = data as BlockState;

    // 设置默认方向
    req.items = req.items.map((v) => {
        v.item.dir = v.item.dir || 'row';
        return v;
    });

    console.log('Request:', req);

    try {
        const result = calc(req, ctx);
        self.postMessage({ taskId, action: 'done', data: result });
    } catch (error) {
        self.postMessage({ taskId, action: 'error', message: error.message });
    }
};

function calc(data: BlockState, ctx: { count: number }): BlockState {
    console.log('Starting calculation', data);

    const all = new Set(defaultBlocks);
    const type_list = data.items.map((v) => v.item.type);
    const type_left = new Set([...all].filter(x => !type_list.includes(x)));

    const board = createBoard(data.items);
    console.log('Initial board:', debugBoard(board));

    const sortedBlocks = Array.from(type_left).sort((a, b) => {
        const sizeA = parseBlockType(a).width * parseBlockType(a).height;
        const sizeB = parseBlockType(b).width * parseBlockType(b).height;
        return sizeB - sizeA; // 从大到小排序
    });

    const ret = search(board, data.items, sortedBlocks, ctx);
    if (ret) {
        return { items: ret };
    } else {
        throw new Error('No solution found');
    }
}

function createBoard(data: BlockItem[]): string[] {
    const board: string[] = Array(64).fill('');
    for (const v of data) {
        if (v.index >= 64) {
            throw new Error(`Index (${v.index}) is out of bounds`);
        }
        const range = typeToRange(v);
        if (!canPlace(board, range)) {
            throw new Error(`Cannot place block at index ${v.index}`);
        }
        placeBlock(board, range, v.item.type);
    }
    return board;
}

interface Range {
    row: number;
    col: number;
    width: number;
    height: number;
}

function placeBlock(board: string[], range: Range, block: BlockType) {
    for (let row = range.row; row < range.row + range.height; row++) {
        for (let col = range.col; col < range.col + range.width; col++) {
            const index = (row << 3) + col;
            if (index >= 64) {
                throw new Error(`Block placement out of bounds at index ${index}`);
            }
            board[index] = block;
        }
    }
}

function canPlace(board: string[], range: Range): boolean {
    if (range.row + range.height > 8 || range.col + range.width > 8) {
        return false;
    }
    for (let row = range.row; row < range.row + range.height; row++) {
        for (let col = range.col; col < range.col + range.width; col++) {
            const index = (row << 3) + col;
            if (index >= 64 || board[index] !== '') {
                return false;
            }
        }
    }
    return true;
}

function typeToRange(v: BlockItem): Range {
    const info = parseBlockType(v.item.type);
    const dir = v.item.dir || 'row';
    const [width, height] = dir === 'row' ? [info.width, info.height] : [info.height, info.width];
    const pos = getIndexRowCol(v.index);
    return {
        width,
        height,
        row: pos.row,
        col: pos.col,
    };
}

function search(board: string[], placed: BlockItem[], left: string[], ctx: { count: number }): BlockItem[] | null {
    if (left.length === 0) {
        console.log('Solution found:', placed);
        return placed;
    }

    // 选择下一个块，优先选择面积最大的块
    const current = left[0];
    const remaining = left.slice(1);

    // 遍历棋盘，寻找第一个空位
    const firstEmpty = board.indexOf('');
    if (firstEmpty === -1) {
        return null;
    }
    const pos = getIndexRowCol(firstEmpty);

    const directions: BlockDirType[] = ['row', 'col'];
    for (const dir of directions) {
        const newBlock: BlockItem = {
            item: {
                type: current,
                dir: dir,
            },
            index: firstEmpty,
        };
        const range = typeToRange(newBlock);
        if (canPlace(board, range)) {
            // 放置块
            placeBlock(board, range, current);
            ctx.count++;
            self.postMessage({ action: "count", count: ctx.count });

            // 前向检查：确保剩余空间足够
            if (isValid(board, remaining)) {
                const result = search(board, placed.concat(newBlock), remaining, ctx);
                if (result) {
                    return result;
                }
            }

            // 回溯
            removeBlock(board, range);
        }
    }

    return null;
}

function removeBlock(board: string[], range: Range) {
    for (let row = range.row; row < range.row + range.height; row++) {
        for (let col = range.col; col < range.col + range.width; col++) {
            const index = (row << 3) + col;
            board[index] = '';
        }
    }
}

function isValid(board: string[], left: string[]): boolean {
    // 简单检查剩余空格是否足够放置剩余的块
    const emptyCount = board.filter(cell => cell === '').length;
    const required = left.reduce((sum, type) => {
        const info = parseBlockType(type);
        return sum + Math.max(info.width, info.height);
    }, 0);
    return emptyCount >= required;
}

function debugBoard(board: string[]): string {
    let out = '';
    for (let i = 0; i < board.length; i++) {
        if (i % 8 === 0 && i !== 0) {
            out += '\n';
        }
        out += (board[i] ? TypeId[board[i]] : '.') + ' ';
    }
    return out;
}

const cache: Record<string, BlockSizeColor> = {};

function parseBlockType(s: string): BlockSizeColor {
    if (cache[s]) {
        return cache[s];
    }
    const [size, color] = s.split(':');
    const [width, height] = size.split('x').map(Number);
    const dir: BlockDirType = 'row'; // 默认方向
    cache[s] = { width, height, color, dir };
    return cache[s];
}

function getIndexRowCol(pos: PositionIndex): RowCol {
    return {
        row: pos >> 3,
        col: pos % 8,
    };
}

console.log('Worker loaded successfully');