// 文書のビルドで、provider の行・文書に書いた値を扱う小さな関数 (reportBuilder.ts の where・expand.ts の ${...} で共通)。
// 行の形は provider ごとに違い、文書の値は書いた人が決めるので、入力は unknown のまま扱う

/** 値の中を a.b.c の名前の並びでたどった先 (途中がオブジェクトでなければ undefined) */
export const valueAtPath = (value: unknown, parts: readonly string[]): unknown => {
    let current = value;
    for (const part of parts) {
        current =
            typeof current === 'object' && current !== null
                ? (current as Record<string, unknown>)[part]
                : undefined;
    }
    return current;
};

/** JSON として同じ値か (where の一致・when の比べ方) */
export const sameJsonValue = (a: unknown, b: unknown): boolean =>
    JSON.stringify(a) === JSON.stringify(b);
