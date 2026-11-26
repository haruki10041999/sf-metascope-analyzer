import { isRecord } from '../../types/commons/utils';

// JSON (解析結果の木) を、種類の分からないまま調べる小さな関数 (walker・参照の取り出しで共通。docs/plan.md 10 章 P2)。
// 入力が unknown なのは、型ガードの入力だから (そのままでよい unknown)。種類の分かる処理は、ノードの型で書く

/** JSON のオブジェクト (配列・null でないもの) */
export type JsonRecord = Record<string, unknown>;

export { isRecord };

/** JSON のオブジェクトならそのオブジェクト (配列・null・ほかの値なら undefined) */
export const recordOf = (value: unknown): JsonRecord | undefined =>
    isRecord(value) ? value : undefined;

/** 文字列ならその文字列 (空の文字列も) */
export const stringOf = (value: unknown): string | undefined =>
    typeof value === 'string' ? value : undefined;

/** 空でない文字列ならその文字列 */
export const nonEmptyStringOf = (value: unknown): string | undefined =>
    typeof value === 'string' && value !== '' ? value : undefined;

/** json[name] の配列のうち、オブジェクトのもの (json がオブジェクトでない・配列でなければ空) */
export const jsonRecordsOf = <T extends JsonRecord = JsonRecord>(
    json: unknown,
    name: string,
): T[] =>
    isRecord(json) && Array.isArray(json[name])
        ? (json[name] as unknown[]).filter((value): value is T => isRecord(value))
        : [];

/** json[name] の配列のうち、文字列のもの */
export const jsonStringsOf = (json: unknown, name: string): string[] =>
    isRecord(json) && Array.isArray(json[name])
        ? (json[name] as unknown[]).filter((value): value is string => typeof value === 'string')
        : [];
