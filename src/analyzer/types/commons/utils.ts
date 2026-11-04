import { createHash } from 'node:crypto';

export const isRecord = (value: unknown): value is Record<string, unknown> => {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
};

// objectKey / sourceKey は 1 ファイル内で一意であればよく、出力サイズへの影響が大きいため 16 桁（64bit）に切り詰める
const HASH_LENGTH = 16;

export const hash = (value: unknown): string => {
    return createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0, HASH_LENGTH);
};
