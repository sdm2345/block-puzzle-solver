import {BlockType, TypeId} from "./types.ts";
import {useRecoilState, useRecoilValue} from "recoil";
import {BLOCK_ID_DIR, BLOCK_ZIndex, MaxZindex} from "./App.tsx";
import {parseBlockType} from "./utils.ts";

interface BlockProps {
    type: BlockType
    zIndex?: number
    float?: boolean
    top?: number
    left?: number
    selected?: boolean
    onClick?: () => void
    onContextMenu?: () => void
    onMouseOver?: () => void
    onMouseOut?: () => void
}

export const baseSize = 40
export const space = 3


export function Block(props: BlockProps) {

    const blockDir = useRecoilValue(BLOCK_ID_DIR)

    const [maxzIndex, setMaxZIndex] = useRecoilState(MaxZindex)
    const [zIndexMap, setZIndexMap] = useRecoilState(BLOCK_ZIndex)
    const info = parseBlockType(props.type)

    const dir = blockDir.get(props.type) || 'row'

    const [w, h] = dir == 'row' ? [info.width, info.height] : [info.height, info.width]

    const [width, height] = [w * baseSize - space * 2, h * baseSize - space * 2]

    return (
        <div
            onContextMenu={() => {
                if (props.onContextMenu) {
                    props.onContextMenu();
                }
            }}
            className={props.selected ? 'block-selected' : ''}
            onClick={() => {
                if (props.onClick) {
                    props.onClick();
                }
                setZIndexMap(zIndexMap.set(props.type, maxzIndex + 1))
                setMaxZIndex(maxzIndex + 1)
            }}

            style={{
                position: "absolute",
                opacity: props.float ? 0.5 : undefined,
                left: (props.left || 0) + space,
                top: (props.top || 0) + space,
                zIndex: zIndexMap.get(props.type),
                width, height,
                backgroundColor: info.color,
                padding: 2,
                border: '1px solid #000',
                borderRadius: 10
            }}>
            <div style={{
                position:"absolute",
                margin: 1,
                width: '100%',
                height: '100%',
            }}>
                <p>
                    {TypeId[props.type]}
                </p>
            </div>
        </div>
    )
}