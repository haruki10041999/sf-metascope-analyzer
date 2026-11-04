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
