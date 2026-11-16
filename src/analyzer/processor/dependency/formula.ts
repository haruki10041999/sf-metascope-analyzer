import type { ConvertKeys } from '../../types/commons/json';
import {
    type FormulaValue,
    type FxSyntax,
    tryParseFormulaSyntax,
} from '../../types/metadata/formula';

// 数式 (数式項目・入力規則・既定値・Flow の数式・ワークフローの条件など) の参照の取り出し。
// 数式の JSON (fx*。段階 M4) の名前 (fxName) から取る。値の木の中の数式 (文字列) は、同じ parser で木にしてから取る。
// 読めない数式だけは、字句に分けて名前を拾う (以前のやり方)。方針: docs/analysis-plan.md 3.3・5.1

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
    /** カスタムメタデータのレコード。名前は定義 (customMetadata の単位) と同じ <型 (__mdt なし)>.<レコード> */
    | { refType: 'customMetadata'; name: string };

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

/** 数式の参照 1 つと、その名前のノード (数式の JSON から取ったときだけ) */
export type FormulaReferenceAt = FormulaReference & { expression?: ConvertKeys };

const isNodeRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

/** 数式の木 (JSON か位置つきの木) の名前のノード (書いた順) */
const namesOf = (node: unknown, out: Record<string, unknown>[] = []): Record<string, unknown>[] => {
    if (Array.isArray(node)) {
        node.forEach((item) => namesOf(item, out));
    } else if (isNodeRecord(node)) {
        if (node.kind === 'fxName') out.push(node);
        for (const [key, child] of Object.entries(node)) {
            if (key !== 'sourceKeys') namesOf(child, out);
        }
    }
    return out;
};

/**
 * 数式 (JSON・位置つきの木・文字列) の参照。object は数式の基準のオブジェクト (項目・入力規則のオブジェクト)。
 * 分からないとき (Flow の数式など) は undefined で、基準のオブジェクトの項目は取り出さない。
 * JSON から取ったときは、参照ごとに最初に書いた名前のノードの sourceKeys を expression に持つ
 */
export const formulaReferencesOf = (
    formula: FormulaValue | FxSyntax,
    object?: string,
): FormulaReferenceAt[] => {
    const tree = typeof formula === 'string' ? tryParseFormulaSyntax(formula) : formula;
    if (!tree) return typeof formula === 'string' ? getTokenReferences(formula, object) : [];
    const references: FormulaReferenceAt[] = [];
    for (const name of namesOf(tree)) {
        const path = (name.path as string[]).join('.');
        if (KEYWORDS.has(path.toLowerCase())) continue;
        const keys = isNodeRecord(name.sourceKeys) ? (name.sourceKeys as ConvertKeys) : undefined;
        for (const reference of referencesOfName(path, object)) {
            references.push(keys ? { ...reference, expression: keys } : reference);
        }
    }
    return dedupe(references);
};

/** 数式の文字列の参照 (formulaReferencesOf の文字列のとき) */
export const getFormulaReferences = (formula: string, object?: string): FormulaReference[] =>
    formulaReferencesOf(formula, object);

/** 読めない数式の参照 (字句に分けて名前を拾う) */
const getTokenReferences = (formula: string, object?: string): FormulaReference[] => {
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
                                    refType: 'customMetadata' as const,
                                    name: `${first.replace(/__mdt$/i, '')}.${second}`,
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

/** 同じ参照は 1 つにする (最初のものを残す。名前のノードの位置は比べない) */
const dedupe = <R extends FormulaReferenceAt>(references: R[]): R[] => {
    const seen = new Set<string>();
    return references.filter((reference) => {
        const { expression: _expression, ...rest } = reference;
        const key = JSON.stringify(rest);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
};
