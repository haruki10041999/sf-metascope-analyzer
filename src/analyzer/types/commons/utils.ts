import { createHash } from 'node:crypto';

// どの JSON にも使う汎用の関数 (isRecord・hash・sortKeys)。入力は形の決まらない JSON なので unknown で受ける
// (そのままでよい unknown。docs/plan.md 10 章 P2)

/** JSON のオブジェクト (配列・null でないもの) か */
export const isRecord = (value: unknown): value is Record<string, unknown> => {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
};

// objectKey / sourceKey は 1 ファイル内で一意であればよく、出力サイズへの影響が大きいため 16 桁（64bit）に切り詰める
const HASH_LENGTH = 16;

export const hash = (value: unknown): string => {
    return createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0, HASH_LENGTH);
};

/** オブジェクトのキーを (入れ子も) 名前の順に並べ替えたもの。配列の順序はそのまま */
export const sortKeys = (value: unknown): unknown => {
    if (Array.isArray(value)) {
        return value.map(sortKeys);
    }
    if (!isRecord(value)) {
        return value;
    }
    return Object.fromEntries(
        Object.keys(value)
            .sort()
            .map((key) => [key, sortKeys(value[key])]),
    );
};
