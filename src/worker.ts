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
} from "./types.ts";

type BoardType = string[];

interface Context {
    count: number;
}

self.onmessage = (event) => {
    const {taskId, data} = event.data;
    const ctx: Context = {count: 0};
    const req = data as BlockState;

    req.items.forEach(v => v.item.dir = v.item.dir || 'row');

    const items = req.items;
    const board_state = createBoardState(items);

    const usedBlocksSet = new Set(items.map(v => v.item.type));
    const leftBlocks = defaultBlocks.filter(block => !usedBlocksSet.has(block));

    // 预先计算块属性
    const blockInfoMap = new Map<BlockType, BlockSizeColor>();
    defaultBlocks.forEach(block => blockInfoMap.set(block, parseBlockType(block)));

    const sortedLeftBlocks = leftBlocks.slice().sort((a, b) => {
        const aInfo = blockInfoMap.get(a)!;
        const bInfo = blockInfoMap.get(b)!;
        return (bInfo.height * bInfo.width) - (aInfo.height * aInfo.width);
    });

    const result = search(board_state, items, sortedLeftBlocks, blockInfoMap, ctx);
    self.postMessage({taskId, action: 'done', data: result});
};

function createBoardState(data: BlockItem[]): BoardType {
    const board: BoardType = new Array(64).fill('');
    data.forEach(v => {
        const {row, col} = getIndexRowCol(v.index);
        const info = parseBlockType(v.item.type);
        const dir = v.item.dir || 'row';
        const [width, height] = dir === 'row' ? [info.width, info.height] : [info.height, info.width];
        for (let r = row; r < row + height; r++) {
            for (let c = col; c < col + width; c++) {
                const index = r * 8 + c;
                board[index] = v.item.type;
            }
        }
    });
    return board;
}

function search(
    board: BoardType,
    placed: BlockItem[],
    left: BlockType[],
    blockInfoMap: Map<BlockType, BlockSizeColor>,
    ctx: Context
): BlockState | undefined {
    if (left.length === 0) {
        return {items: placed};
    }

    // 找到第一个空位置
    let firstEmptyIndex = -1;
    for (let i = 0; i < 64; i++) {
        if (board[i] === '') {
            firstEmptyIndex = i;
            break;
        }
    }

    if (firstEmptyIndex === -1) return undefined;

    const {row, col} = getIndexRowCol(firstEmptyIndex);

    for (let i = 0; i < left.length; i++) {
        const blockType = left[i];
        const info = blockInfoMap.get(blockType)!;
        const directions = ['row', 'col'];
        for (const dir of directions) {
            const [width, height] = dir === 'row' ? [info.width, info.height] : [info.height, info.width];
            if (row + height > 8 || col + width > 8) continue;

            let canPlace = true;
            for (let r = row; r < row + height; r++) {
                for (let c = col; c < col + width; c++) {
                    const index = r * 8 + c;
                    if (board[index] !== '') {
                        canPlace = false;
                        break;
                    }
                }
                if (!canPlace) break;
            }

            if (canPlace) {
                ctx.count++;
                self.postMessage({action: "count", count: ctx.count});

                const newPlaced = [...placed];
                const newBoard = [...board];
                newPlaced.push({item: {type: blockType, dir: dir as BlockDirType}, index: firstEmptyIndex});
                for (let r = row; r < row + height; r++) {
                    for (let c = col; c < col + width; c++) {
                        const index = r * 8 + c;
                        newBoard[index] = blockType;
                    }
                }

                const newLeft = [...left];
                newLeft.splice(i, 1);
                const result = search(newBoard, newPlaced, newLeft, blockInfoMap, ctx);
                if (result) return result;
            }
        }
    }

    return undefined;
}

function getIndexRowCol(pos: PositionIndex): RowCol {
    return {row: Math.floor(pos / 8), col: pos % 8};
}

const cache: Record<string, BlockSizeColor> = {};

function parseBlockType(s: string): BlockSizeColor {
    if (cache[s]) return cache[s];
    const [size, color, dir] = s.split(':');
    const [height, width] = size.split('x').map(v => parseInt(v));
    cache[s] = {width, height, color, dir: dir as BlockDirType};
    return cache[s];
}