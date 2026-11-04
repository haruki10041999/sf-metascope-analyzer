// Apex / メタデータ / LWC で共通の、差分の木の判定

/** 差分の中に unchanged 以外の status が 1 つでもあれば、変化ありとする */
export const hasChange = (diff: unknown): boolean => {
    if (Array.isArray(diff)) {
        return diff.some(hasChange);
    }
    if (typeof diff !== 'object' || diff === null) {
        return false;
    }
    const record = diff as Record<string, unknown>;
    if (typeof record.status === 'string' && record.status !== 'unchanged') {
        return true;
    }
    // unchanged のノードは value に元の JSON を持つだけなので、中は見ない
    return record.status === 'unchanged'
        ? false
        : Object.entries(record).some(([key, value]) => key !== 'value' && hasChange(value));
};
