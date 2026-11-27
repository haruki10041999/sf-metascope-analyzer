import type { ConvertKeys } from '../../../types';
import type { ApexBodySemantics, ApexResolvedCall } from './analyze';
import { type ApexStringSegment, apexDataflowOf } from './dataflow';

// 動的 SOQL の復元 (Database.query(q) の q を、値の解析で分かる文字列から組み立てて読む。docs/plan.md 10 章 P4 段 2
// 「動的 SOQL・SOSL の復元」・docs/plan-details.md C-6)。9 章の決めたこと:
// - 一部が分からなくても、確実な部分だけ取り出す。確実の条件:
//   - オブジェクト: いちばん外の FROM のあとの名前が、前後とも分かる文字 (空白・括弧・カンマ・文字列の終わり) で
//     区切られているときだけ (名前の直後が分からない部分なら、名前が続いているかもしれないので取らない)
//   - 項目: いちばん外の SELECT から FROM までに分からない部分がないときだけ、その項目の並び
//   - WHERE・ORDER BY などの項目、サブクエリ (子リレーション) は取らない
// - 取り出した参照の位置は、元の呼び出し (Database.query(...)) の位置にまとめる
// SOSL (Search.query) は復元しない

/** 動的なクエリの呼び出し (標準の型 Database・Search のメソッド名、小文字) */
const DYNAMIC_QUERY_METHODS: Readonly<Record<string, readonly string[]>> = {
    database: [
        'query',
        'querywithbinds',
        'countquery',
        'countquerywithbinds',
        'getquerylocator',
        'getquerylocatorwithbinds',
    ],
    search: ['query'],
};

/** 呼び出しが動的なクエリなら、言語 (Database は SOQL、Search は SOSL) */
export const dynamicQueryLanguageOf = (call: ApexResolvedCall): 'soql' | 'sosl' | undefined => {
    const type = call.receiverType;
    const named = type?.kind === 'static' ? type.type : type?.kind === 'named' ? type : undefined;
    if (named?.standard?.kind !== 'type') return undefined;
    const owner = named.standard.qualifiedName.split('.').pop()?.toLowerCase() ?? '';
    if (!DYNAMIC_QUERY_METHODS[owner]?.includes(call.name.toLowerCase())) return undefined;
    return owner === 'search' ? 'sosl' : 'soql';
};

/** 復元した動的なクエリ 1 つ */
export type ApexDynamicQuery = {
    /** 呼び出しの ID と位置 (取り出した参照の位置) */
    callId: string;
    sourceKeys: ConvertKeys;
    language: 'soql' | 'sosl';
    /** complete: 文字列がすべて分かった / partial: 一部だけ / none: 分かる文字がない・SOSL */
    restoration: 'complete' | 'partial' | 'none';
    /** 組み立てた文字列 (分からない部分は {?}) */
    text: string;
    /** いちばん外の FROM のオブジェクト */
    objects: string[];
    /** SELECT の項目 (書いたまま。関係のパスは a.b のまま。集計関数などは除く) */
    fields: string[];
};

const HOLE = '\u0000';

/** SOQL の文字列 (分からない部分は HOLE) から、確実なオブジェクトと項目 */
export const dynamicSoqlPartsOf = (
    segments: readonly ApexStringSegment[],
): { objects: string[]; fields: string[] } => {
    const text = segments.map((s) => ('text' in s ? s.text : HOLE)).join('');
    // いちばん外 (括弧の深さ 0) の SELECT・FROM の位置
    let depth = 0;
    let select = -1;
    let from = -1;
    const word = /[A-Za-z_]+/y;
    for (let i = 0; i < text.length && from < 0; i++) {
        const c = text[i]!;
        if (c === '(') depth++;
        else if (c === ')') depth--;
        else if (depth === 0 && /[A-Za-z_]/.test(c) && (i === 0 || /[\s(,]/.test(text[i - 1]!))) {
            word.lastIndex = i;
            const token = word.exec(text)?.[0] ?? '';
            if (/^select$/i.test(token) && select < 0) select = i;
            else if (/^from$/i.test(token) && select >= 0) from = i;
            i += token.length - 1;
        }
    }
    if (from < 0) return { objects: [], fields: [] };
    // FROM のあとの名前 (前後とも分かる文字で区切られているときだけ)
    const after = text.slice(from + 4);
    const object = after.match(/^\s+([A-Za-z_][A-Za-z0-9_]*)(?=$|[\s),])/)?.[1];
    if (!object) return { objects: [], fields: [] };
    // SELECT から FROM までに分からない部分がなければ、項目の並び (括弧の深さ 0 のカンマで分ける)
    const list = text.slice(select + 6, from);
    const fields: string[] = [];
    if (!list.includes(HOLE)) {
        let level = 0;
        let start = 0;
        const items: string[] = [];
        for (let i = 0; i <= list.length; i++) {
            const c = list[i];
            if (c === '(') level++;
            else if (c === ')') level--;
            else if ((c === ',' && level === 0) || c === undefined) {
                items.push(list.slice(start, i).trim());
                start = i + 1;
            }
        }
        for (const item of items) if (/^[A-Za-z_][\w.]*$/.test(item)) fields.push(item);
    }
    return { objects: [object], fields };
};

/** 実行本体の中の、動的なクエリの呼び出しと、復元した中身 */
export const apexDynamicQueriesOf = (semantics: ApexBodySemantics): ApexDynamicQuery[] => {
    const calls = semantics.calls.filter((call) => dynamicQueryLanguageOf(call));
    if (!calls.length) return [];
    const flow = apexDataflowOf(semantics);
    return calls.map((call): ApexDynamicQuery => {
        const language = dynamicQueryLanguageOf(call)!;
        const argument = call.args[0];
        const segments = argument ? flow.segmentsOf(argument) : [];
        const known = segments.some((s) => 'text' in s);
        const complete = known && segments.every((s) => 'text' in s);
        const parts =
            language === 'soql' ? dynamicSoqlPartsOf(segments) : { objects: [], fields: [] };
        return {
            callId: call.id,
            sourceKeys: call.sourceKeys,
            language,
            restoration: language === 'sosl' || !known ? 'none' : complete ? 'complete' : 'partial',
            text: segments.map((s) => ('text' in s ? s.text : '{?}')).join(''),
            ...parts,
        };
    });
};
