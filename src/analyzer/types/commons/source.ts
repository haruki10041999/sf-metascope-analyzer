// ソース上の位置。Apex (ANTLR) と XML のどちらの解析でも同じ形にする。
// 行は 1 始まり、列は 0 始まり。end は範囲の次の位置 (offset は含まない)

export type SourcePosition = {
    offset: number;
    line: number;
    column: number;
};

export type SourceSpan = {
    context: string;
    start: SourcePosition;
    end: SourcePosition;
};

/** 文字位置 → SourcePosition (行・列) の変換を作る。改行は LF にそろえておく */
export const makePositionOf = (source: string) => {
    const lineStarts = [0];
    for (let i = 0; i < source.length; i++) {
        if (source[i] === '\n') lineStarts.push(i + 1);
    }
    return (offset: number): SourcePosition => {
        let low = 0;
        let high = lineStarts.length - 1;
        while (low < high) {
            const middle = (low + high + 1) >> 1;
            if (lineStarts[middle]! <= offset) low = middle;
            else high = middle - 1;
        }
        return { offset, line: low + 1, column: offset - lineStarts[low]! };
    };
};
