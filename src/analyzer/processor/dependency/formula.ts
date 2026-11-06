// 数式 (数式項目・入力規則・既定値・Flow の数式・ワークフローの条件など) の参照の取り出し。
// 数式の文法は小さく、要るのは名前の取り出しだけなので、字句に分けて名前を拾う (式の木は作らない)。
// 方針: docs/analysis-plan.md 3.3・5.1

/** 数式の中の参照 1 つ */
export type FormulaReference =
    /** 基準のオブジェクトの項目 (Amount__c)、または関係をたどった項目 (Account.Name → Account の Name) */
    | { refType: 'field'; object: string; field: string; path: string[] }
    /** $User.Id / $Profile.Name / $Organization.Name など */
    | { refType: 'globalVariable'; name: string }
    | { refType: 'customLabel'; name: string }
    | { refType: 'customPermission'; name: string }
    /** $Setup.<カスタム設定>.<項目>・$CustomMetadata.<型>.<レコード>.<項目>・$ObjectType.<オブジェクト>.Fields.<項目> */
    | { refType: 'object'; name: string }
    | { refType: 'customMetadataRecord'; name: string };

type Token =
    | { type: 'name'; value: string; start: number }
    | { type: 'string'; start: number }
    | { type: 'other'; value: string; start: number };

/** 字句に分ける。名前は . でつないだもの ($User.Id / Account.Owner.Name) を 1 つにする */
export const tokenizeFormula = (formula: string): Token[] => {
    const tokens: Token[] = [];
    let i = 0;
    while (i < formula.length) {
        const ch = formula[i]!;
        // コメント /* */
        if (ch === '/' && formula[i + 1] === '*') {
            const end = formula.indexOf('*/', i + 2);
            i = end < 0 ? formula.length : end + 2;
            continue;
        }
        // 文字列 ('...' / "...")。\ でエスケープ
        if (ch === '"' || ch === "'") {
            const start = i;
            i++;
            while (i < formula.length && formula[i] !== ch) i += formula[i] === '\\' ? 2 : 1;
            i++;
            tokens.push({ type: 'string', start });
            continue;
        }
        // 名前 (英字・$ で始まり、英数字・_・. が続く)。{!...} (差し込み項目) の中もそのまま読む
        if (/[A-Za-z$_]/.test(ch)) {
            const start = i;
            while (i < formula.length && /[A-Za-z0-9_$.]/.test(formula[i]!)) i++;
            tokens.push({
                type: 'name',
                value: formula.slice(start, i).replace(/\.+$/, ''),
                start,
            });
            continue;
        }
        if (/\s/.test(ch)) {
            i++;
            continue;
        }
        tokens.push({ type: 'other', value: ch, start: i });
        i++;
    }
    return tokens;
};

/** 関数でも項目でもない名前 (定数・演算子の名前) */
const KEYWORDS = new Set(['true', 'false', 'null', 'and', 'or', 'not']);

/**
 * 数式の参照。object は数式の基準のオブジェクト (項目・入力規則のオブジェクト)。
 * 分からないとき (Flow の数式など) は undefined で、基準のオブジェクトの項目は取り出さない
 */
export const getFormulaReferences = (formula: string, object?: string): FormulaReference[] => {
    const tokens = tokenizeFormula(formula);
    const references: FormulaReference[] = [];
    tokens.forEach((token, index) => {
        if (token.type !== 'name') return;
        const next = tokens[index + 1];
        // 関数の呼び出し (IF( / ISPICKVAL( など)
        if (next?.type === 'other' && next.value === '(') return;
        if (KEYWORDS.has(token.value.toLowerCase())) return;
        // 数値の続き (1.5e3 など) ではない名前だけ
        references.push(...referencesOfName(token.value, object));
    });
    return dedupe(references);
};

const referencesOfName = (name: string, object?: string): FormulaReference[] => {
    const parts = name.split('.').filter(Boolean);
    const [head, ...rest] = parts;
    if (!head) return [];
    if (head.startsWith('$')) return globalReferences(head, rest, object);
    if (!object) return [];
    return fieldPathReferences(object, parts);
};

/** Account.Owner.Name → 基準のオブジェクトの Account (関係) と、関係先の項目。関係先のオブジェクトは名前から推す */
const fieldPathReferences = (object: string, parts: string[]): FormulaReference[] => {
    const [first, ...rest] = parts;
    if (!first) return [];
    if (rest.length === 0) return [{ refType: 'field', object, field: first, path: [first] }];
    // 関係の名前 (Account__r → Account__c、Account → AccountId) の項目を参照にする。たどった先は path に残す
    const field = /__r$/i.test(first) ? first.replace(/__r$/i, '__c') : `${first}Id`;
    return [{ refType: 'field', object, field, path: parts }];
};

const globalReferences = (head: string, rest: string[], object?: string): FormulaReference[] => {
    const key = head.toLowerCase();
    const [first, second, third] = rest;
    switch (key) {
        case '$label':
            return first ? [{ refType: 'customLabel', name: first }] : [];
        case '$permission':
            return first ? [{ refType: 'customPermission', name: first }] : [];
        case '$setup':
            return first
                ? [
                      { refType: 'object', name: first },
                      ...(second
                          ? [
                                {
                                    refType: 'field' as const,
                                    object: first,
                                    field: second,
                                    path: [second],
                                },
                            ]
                          : []),
                  ]
                : [];
        case '$custommetadata':
            return first
                ? [
                      { refType: 'object', name: first },
                      ...(second
                          ? [
                                {
                                    refType: 'customMetadataRecord' as const,
                                    name: `${first}.${second}`,
                                },
                            ]
                          : []),
                      ...(third
                          ? [
                                {
                                    refType: 'field' as const,
                                    object: first,
                                    field: third,
                                    path: [third],
                                },
                            ]
                          : []),
                  ]
                : [];
        case '$objecttype': {
            if (!first) return [];
            // $ObjectType.Account.Fields.Name
            const field = second?.toLowerCase() === 'fields' ? third : undefined;
            return [
                { refType: 'object', name: first },
                ...(field
                    ? [{ refType: 'field' as const, object: first, field, path: [field] }]
                    : []),
            ];
        }
        case '$record':
        case '$record__prior':
            // レコードトリガーの Flow のレコード (object は Flow の対象のオブジェクト)
            return object && first ? fieldPathReferences(object, rest) : [];
        default:
            return [{ refType: 'globalVariable', name: [head, ...rest].join('.') }];
    }
};

const dedupe = (references: FormulaReference[]): FormulaReference[] => {
    const seen = new Set<string>();
    return references.filter((reference) => {
        const key = JSON.stringify(reference);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
};
