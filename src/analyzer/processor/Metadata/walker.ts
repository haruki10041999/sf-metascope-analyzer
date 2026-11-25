import { type ConvertKeys, type JsonType, isJsonType } from '../../types';
import { type WalkHandlers, walkJson } from '../commons/node';

// メタデータの JSON の共通の走査 (docs/json-redesign-plan.md の段階 M1、docs/metadata-json-review.md 7.1 の #2)。
// LWC の walker (processor/Lwc/walker.ts) と同じ形: 処理 (Visitor) を登録して JSON を 1 回だけたどる。
// - メタデータの JSON は、種類ごとの型のノード (kind と sourceKeys を持つ) と、値の木 (Flow の要素の中身・
//   条件の行など。kind を持たない) が混ざる。走査はどちらの中にも入る
// - 値の木は kind を持たないので、Visitor は kind ごとの処理 (kinds) のほかに、すべてのオブジェクト (record) と
//   文字列のプロパティ (value) を受け取れる
// - 文脈は、単位 (種類と名前)・数式の基準のオブジェクト・メンバー (直前の name / fullName)・直前の境界ノードの sourceKeys・
//   プロパティ名の並び (path)

type Json = Record<string, unknown>;

/** 走査中の文脈 */
export type MetadataWalkContext = {
    /** 単位の種類 (dataType) */
    readonly dataType: string;
    /** 単位の名前 (fullName など) */
    readonly unitName: string;
    /** 数式・条件の項目の基準のオブジェクト (ワークフローなら単位の名前、Flow なら起動のオブジェクト) */
    readonly object?: string | undefined;
    /** 今いるメンバー (直前の name / fullName。単位そのものは持たない) */
    readonly member?: string | undefined;
    /** 直前の境界ノード (sourceKeys を持つノード) の sourceKeys */
    readonly statement?: ConvertKeys | undefined;
    /** 単位のルートからのプロパティ名の並び (配列の添字は入れない) */
    readonly path: readonly string[];
};

/** 処理。false を返すとそのノードの中に入らない */
export type MetadataVisitor = {
    /** kind ごとの処理 (種類ごとの型のノード) */
    kinds?: { [kind: string]: (node: Json, context: MetadataWalkContext) => void | boolean };
    /** すべてのオブジェクト (kind のないものも)。context はそのノードに入ったあとのもの */
    record?: (node: Json, context: MetadataWalkContext) => void | boolean;
    /** 文字列のプロパティ (key: value)。owner は値を持つオブジェクト */
    value?: (key: string, value: string, owner: Json, context: MetadataWalkContext) => void;
};

/** 複数の Visitor を 1 つにする (どれかが false を返せば中に入らない) */
export const composeMetadataVisitors = (...visitors: MetadataVisitor[]): MetadataVisitor => {
    const kinds = new Set(visitors.flatMap((visitor) => Object.keys(visitor.kinds ?? {})));
    const all = <A extends unknown[]>(
        handlers: (((...args: A) => void | boolean) | undefined)[],
    ): ((...args: A) => boolean) => {
        const defined = handlers.filter((h): h is (...args: A) => void | boolean => !!h);
        return (...args: A) => {
            let enter = true;
            for (const handler of defined) if (handler(...args) === false) enter = false;
            return enter;
        };
    };
    return {
        kinds: Object.fromEntries(
            [...kinds].map((kind) => [kind, all(visitors.map((v) => v.kinds?.[kind]))]),
        ),
        record: all(visitors.map((v) => v.record)),
        value: all(visitors.map((v) => v.value)),
    };
};

const isRecord = (value: unknown): value is Json =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const str = (value: unknown): string | undefined =>
    typeof value === 'string' && value !== '' ? value : undefined;

const keysOf = (node: Json): ConvertKeys | undefined =>
    isRecord(node.sourceKeys) ? (node.sourceKeys as ConvertKeys) : undefined;

/** 数式の JSON のノード (fxName・fxCall など) */
export const isFormulaNode = (node: Json): boolean =>
    typeof node.kind === 'string' && node.kind.startsWith('fx');

/** 単位の種類ごとの、数式・条件の項目の基準のオブジェクト (対象のオブジェクト) */
export const metadataBaseObjectOf = (
    dataType: string,
    json: Json,
    unitName: string,
): string | undefined => {
    switch (dataType) {
        case 'flow':
            return isRecord(json.start) ? str(json.start.object) : undefined;
        case 'workflow':
        case 'sharingRules':
        case 'matchingRules':
        case 'assignmentRules':
        case 'autoResponseRules':
        case 'escalationRules':
            return unitName;
        case 'approvalProcess':
        case 'duplicateRule':
            return unitName.split('.')[0];
        // 種類ごとに要素名が違う対象のオブジェクトを 1 つにする (段階 M8。docs/metadata-json-review.md 2.3。
        // JSON は XML の名前のまま持ち、使う側はここで引く)
        case 'layout':
        case 'objectTranslation':
            return str(json.objectApiName);
        case 'flexiPage':
            return str(json.sobjectType);
        case 'quickAction':
            // オブジェクト固有のアクション (<オブジェクト>.<名前>) は名前から。作成のアクションは作るオブジェクト
            return (
                str(json.targetObject) ??
                (unitName.includes('.') ? unitName.split('.')[0] : undefined)
            );
        case 'pathAssistant':
            return str(json.entityName);
        case 'emailTemplate':
            return str(json.relatedEntityType);
        default:
            return undefined;
    }
};

/** 単位の JSON の、走査の最初の文脈 */
export const initialMetadataWalkContext = (
    dataType: string,
    json: Json,
    unitName: string,
): MetadataWalkContext => ({
    dataType,
    unitName,
    object: metadataBaseObjectOf(dataType, json, unitName),
    statement: keysOf(json),
    path: [],
});

/** ノードに入るときの文脈 (メンバーと直前の境界ノード) */
const enterContext = (node: Json, context: MetadataWalkContext): MetadataWalkContext => {
    // 数式のノード (fx*。段階 M4) は式なので、メンバー (fxCall の name は関数名) にも直前の境界ノード (文) にもしない
    if (isFormulaNode(node)) return context;
    const name = str(node.name) ?? str(node.fullName);
    const member = name && name !== context.unitName ? name : context.member;
    const statement = keysOf(node) ?? context.statement;
    return member === context.member && statement === context.statement
        ? context
        : { ...context, member, statement };
};

/**
 * JSON (単位のルート、または中のノード) をたどる。
 * kind と sourceKeys を持つノードは共通の走査 (commons/node.ts の walkJson) で辿り、ノードの中の値の木
 * (kind のないオブジェクト・文字列) は、そのノードに入るときに辿る。値の木の中で出会ったノードは、そこまでの文脈
 * (path・member など) を覚えておき、walkJson が辿るときに使う。ノードの中では、値の木と文字列を先に、
 * 子のノードを後に訪ねる
 */
export const walkMetadataJson = (
    value: unknown,
    visitor: MetadataVisitor,
    context: MetadataWalkContext,
): void => {
    /** 値の木の中で出会ったノード → そこまでの文脈 */
    const contextOf = new WeakMap<object, MetadataWalkContext>();
    /** 中に入らなかった値の木の下のノード (walkJson でも辿らない) */
    const skipped = new WeakSet<object>();
    const skipNodesIn = (child: unknown): void => {
        if (Array.isArray(child)) return child.forEach(skipNodesIn);
        if (!isRecord(child)) return;
        if (isJsonType(child)) {
            skipped.add(child);
            return;
        }
        for (const [key, item] of Object.entries(child))
            if (key !== 'sourceKeys') skipNodesIn(item);
    };

    /** オブジェクト 1 つ (record と kind ごとの処理)。false なら中に入らない */
    const enterRecord = (node: Json, inner: MetadataWalkContext): boolean => {
        let enter = visitor.record?.(node, inner) !== false;
        const kind = str(node.kind);
        const handler = kind ? visitor.kinds?.[kind] : undefined;
        if (handler && handler(node, inner) === false) enter = false;
        return enter;
    };

    /**
     * オブジェクトのプロパティ (文字列は value、オブジェクト・配列は値の木)。
     * 出会ったノードは文脈を覚え、found があれば足す (根が値の木のとき、あとで walkJson で辿る)
     */
    const properties = (node: Json, inner: MetadataWalkContext, found?: JsonType<string>[]) => {
        for (const [key, child] of Object.entries(node)) {
            if (key === 'sourceKeys') continue;
            if (typeof child === 'string') {
                visitor.value?.(key, child, node, inner);
            } else if (typeof child === 'object' && child !== null) {
                tree(child, { ...inner, path: [...inner.path, key] }, found);
            }
        }
    };

    const tree = (child: unknown, current: MetadataWalkContext, found?: JsonType<string>[]) => {
        if (Array.isArray(child)) {
            for (const item of child) tree(item, current, found);
            return;
        }
        if (!isRecord(child)) return;
        if (isJsonType(child)) {
            contextOf.set(child, current);
            found?.push(child);
            return;
        }
        const inner = enterContext(child, current);
        if (enterRecord(child, inner)) properties(child, inner, found);
        else skipNodesIn(Object.values(child));
    };

    const handlers: WalkHandlers<JsonType<string>, MetadataWalkContext> = {
        enterAny: (node, { state }) => {
            if (skipped.has(node)) return 'skip';
            const inner = enterContext(node, contextOf.get(node) ?? state);
            if (!enterRecord(node, inner)) return 'skip';
            properties(node, inner);
            return { state: inner };
        },
    };

    // 根 (配列・値の木のときは、中で出会ったノードを順に辿る)
    const found: JsonType<string>[] = [];
    tree(value, context, found);
    for (const node of found)
        if (!skipped.has(node)) walkJson(node, handlers, contextOf.get(node)!);
};

/** 値の木 (や JSON) の中の、プロパティ name の文字列をすべて集める (書いた順) */
export const metadataValuesOf = (tree: unknown, name: string): string[] => {
    const found: string[] = [];
    walkMetadataJson(
        tree,
        { value: (key, value) => key === name && found.push(value) },
        { dataType: '', unitName: '', path: [] },
    );
    return found;
};

/** 値の木 (や JSON) の中のオブジェクトをすべて (書いた順。入れ子も) */
export const metadataRecordsOf = (tree: unknown): Json[] => {
    const found: Json[] = [];
    walkMetadataJson(
        tree,
        { record: (node) => void found.push(node) },
        { dataType: '', unitName: '', path: [] },
    );
    return found;
};
