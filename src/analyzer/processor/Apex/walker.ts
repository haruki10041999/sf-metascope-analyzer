import type { ApexUnitParseResult } from '../../parser/Apex/unit';
import type { ConvertKeys } from '../../types';

// Apex の JSON の走査 (docs/json-redesign-plan.md の段階 A3、docs/apex-json-analysis.md 2.1・2.2)。
// LWC の walker (processor/Lwc/walker.ts) と同じ形: kind ごとの処理 (Visitor) を登録して JSON を 1 回だけたどる。
// - 式はどれも kind を持つ (段階 A2) ので、形からの種類分けは要らない
// - 文脈は、クラス・メンバー・直前の文・変数のスコープ・ループ・入れ子・try・テストの中か
// - 変数のスコープは block を持つノードごとに作る (for の変数・ブロックの中の変数を外に漏らさない。
//   docs/apex-json-review.md 5 章の 7)。宣言 (項目・プロパティ・引数・ローカル変数・for・catch) は走査が登録する
// - 解析は 1 つの時点の JSON だけを入力にする (Diff に依存しない)。結果には元のノードの sourceKeys を持たせる

type Json = Record<string, unknown>;

/** 変数の型。collection は List / Set / Map / 配列 (要素の型を type に持つ) */
export type ApexVariableType = { type: string; collection: boolean };

/** 名前 (小文字) → 変数の型 */
export type ApexScope = Map<string, ApexVariableType>;

export type ApexWalkContext = {
    /** 今いるクラス (入れ子は Outer.Inner) */
    className?: string | undefined;
    /** 今いるメンバー (Outer.Inner.method。クラスの直下はクラス、トリガーはトリガー名) */
    member?: string | undefined;
    /** 今いるメンバーの種類 */
    memberKind?: string | undefined;
    /** 直前の文 (メソッドの中の 1 文。宣言の直下ならその宣言) の sourceKeys */
    statement?: ConvertKeys | undefined;
    /** 変数のスコープ (外側から順) */
    scopes: readonly ApexScope[];
    /** for / while / do の入れ子の深さ (メンバーの境界で 0 に戻す) */
    loopDepth: number;
    /** if / for / while / do / try / switch の入れ子の深さ (メンバーの境界で 0 に戻す) */
    nestingDepth: number;
    /** try の節の中か (catch・finally の節は含めない) */
    inTry: boolean;
    /** @IsTest のクラス・メソッドの中か */
    isTest: boolean;
};

/** kind ごとの処理。false を返すとそのノードの中に入らない。context はそのノードに入ったあとのもの */
export type ApexVisitor = {
    [kind: string]: ((node: Json, context: ApexWalkContext) => void | boolean) | undefined;
};

export const initialApexWalkContext = (
    overrides: Partial<ApexWalkContext> = {},
): ApexWalkContext => ({
    scopes: [new Map()],
    loopDepth: 0,
    nestingDepth: 0,
    inTry: false,
    isTest: false,
    ...overrides,
});

/** 複数の Visitor を 1 つにする (1 回の走査で複数の解析をする。どれかが false を返せば中に入らない) */
export const composeApexVisitors = (...visitors: ApexVisitor[]): ApexVisitor => {
    const kinds = new Set(visitors.flatMap((visitor) => Object.keys(visitor)));
    const composed: ApexVisitor = {};
    for (const kind of kinds) {
        const handlers = visitors.flatMap((visitor) => (visitor[kind] ? [visitor[kind]!] : []));
        composed[kind] = (node, context) => {
            let enter = true;
            for (const handler of handlers) if (handler(node, context) === false) enter = false;
            return enter;
        };
    }
    return composed;
};

const isRecord = (value: unknown): value is Json =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const str = (value: unknown): string | undefined => (typeof value === 'string' ? value : undefined);

/**
 * ノードのキー。宣言 (class・method など) の sourceKeys は { base, name, ... } の形なので、ノード自身の base にする
 * (そのままだと sourceKey がなく、宣言どうしが同じ場所に見える)
 */
const keysOf = (node: Json): ConvertKeys | undefined => {
    const keys = node.sourceKeys;
    if (!isRecord(keys)) return undefined;
    return (isRecord(keys.base) ? keys.base : keys) as ConvertKeys;
};

/** 文の kind (直前の文にする) */
export const APEX_STATEMENT_KINDS: ReadonlySet<string> = new Set([
    'blockStatement',
    'break',
    'continue',
    'delete',
    'doWhile',
    'expression',
    'for',
    'forEach',
    'if',
    'insert',
    'localVariable',
    'merge',
    'return',
    'runAs',
    'switch',
    'throw',
    'try',
    'undelete',
    'update',
    'upsert',
    'while',
]);

/** 宣言の kind (宣言の直下は、その宣言を直前の文にする) */
const DECLARATION_KINDS = new Set([
    'class',
    'interface',
    'enum',
    'method',
    'constructor',
    'interfaceMethod',
    'property',
    'field',
    'initializer',
]);

const TYPE_DECLARATION_KINDS = new Set(['class', 'interface', 'enum']);
const MEMBER_KINDS = new Set([
    'method',
    'constructor',
    'interfaceMethod',
    'property',
    'initializer',
]);
const LOOP_KINDS = new Set(['for', 'forEach', 'while', 'doWhile']);
const NESTING_KINDS = new Set([...LOOP_KINDS, 'if', 'try', 'switch']);

// ---------------------------------------------------------------------------
// 型の名前
// ---------------------------------------------------------------------------

/** customType (名前か、. でつないだ名前の並び) の名前 */
export const apexCustomTypeName = (customType: unknown): string | undefined => {
    if (typeof customType === 'string') return customType;
    if (Array.isArray(customType) && customType.length) return customType.map(String).join('.');
    return undefined;
};

/** 型 (List<Account> は要素の型 Account、Map は値の型) の名前。名前の型でなければ undefined */
export const apexElementTypeOf = (type: unknown): string | undefined => {
    if (!isRecord(type)) return undefined;
    const own = apexCustomTypeName(type.customType);
    if (own) return own;
    if (type.type === 'list' || type.type === 'set' || type.type === 'array') {
        return apexElementTypeOf(type.elementType);
    }
    if (type.type === 'map') return apexElementTypeOf(type.valueType);
    return undefined;
};

/** 型の中の名前の型 (List<Map<Id, Account>> なら Account。ジェネリクス・要素の型も) */
export const apexCustomTypesOf = (type: unknown): string[] => {
    if (!isRecord(type)) return [];
    const own = apexCustomTypeName(type.customType);
    return [
        ...(own ? [own] : []),
        ...apexCustomTypesOf(type.elementType),
        ...apexCustomTypesOf(type.keyType),
        ...apexCustomTypesOf(type.valueType),
        ...(Array.isArray(type.generic) ? type.generic.flatMap(apexCustomTypesOf) : []),
    ];
};

// ---------------------------------------------------------------------------
// 式の部品
// ---------------------------------------------------------------------------

/** 識別子の名前。識別子でなければ undefined */
export const apexIdentifierOf = (value: unknown): string | undefined =>
    isRecord(value) && value.kind === 'identifier' ? str(value.name) : undefined;

/** 文字列のリテラルの値。リテラルでなければ undefined */
export const apexStringLiteralOf = (value: unknown): string | undefined =>
    isRecord(value) && value.kind === 'string' ? str(value.value) : undefined;

/** . でつないだ名前 (System.Label.Greeting)。名前だけの並びでなければ undefined */
export const apexDottedNameOf = (value: unknown): string | undefined => {
    const identifier = apexIdentifierOf(value);
    if (identifier !== undefined) return identifier;
    if (isRecord(value) && value.kind === 'memberAccess' && value.type === 'object') {
        const object = apexDottedNameOf(value.object);
        return object === undefined ? undefined : `${object}.${String(value.member)}`;
    }
    return undefined;
};

/** 変数の型 (内側のスコープから探す。Apex の名前は大文字・小文字を区別しない) */
export const apexVariableOf = (
    context: ApexWalkContext,
    name: string,
): ApexVariableType | undefined => {
    for (let i = context.scopes.length - 1; i >= 0; i--) {
        const type = context.scopes[i]!.get(name.toLowerCase());
        if (type) return type;
    }
    return undefined;
};

/** アノテーションの名前 (小文字) の一覧 (修飾子の分類をまたいで) */
export const apexAnnotationsOf = (node: Json): string[] => {
    const modifier = node.modifier;
    const items = Array.isArray(modifier)
        ? modifier
        : isRecord(modifier)
          ? Object.values(modifier).flatMap((list) => (Array.isArray(list) ? list : []))
          : [];
    return items.flatMap((item) =>
        isRecord(item) && item.kind === 'annotation' && typeof item.name === 'string'
            ? [item.name.toLowerCase()]
            : [],
    );
};

// ---------------------------------------------------------------------------
// 走査
// ---------------------------------------------------------------------------

/** 変数を登録する (今いちばん内側のスコープ) */
const declare = (context: ApexWalkContext, name: unknown, type: unknown) => {
    const element = apexElementTypeOf(type);
    if (typeof name !== 'string' || !element) return;
    const collection = isRecord(type) && !apexCustomTypeName(type.customType);
    context.scopes[context.scopes.length - 1]!.set(name.toLowerCase(), {
        type: element,
        collection,
    });
};

/** 型の宣言の直下の項目・プロパティ (メソッドから使うので先に登録する) */
const declareMembers = (context: ApexWalkContext, node: Json) => {
    for (const member of Array.isArray(node.block) ? node.block : []) {
        if (!isRecord(member)) continue;
        if (member.kind === 'field' && Array.isArray(member.variants)) {
            for (const variant of member.variants) {
                if (isRecord(variant)) declare(context, variant.name, member.variantType);
            }
        } else if (member.kind === 'property') {
            declare(context, member.name, member.variantType);
        }
    }
};

/** ノードに入るときの文脈 (宣言・文・ループ・変数) */
const enterContext = (node: Json, context: ApexWalkContext): ApexWalkContext => {
    const kind = str(node.kind);
    let next = context;
    // block を持つノードごとに、変数のスコープを作る
    if ('block' in node || 'getterContent' in node || 'setterContent' in node) {
        next = { ...next, scopes: [...next.scopes, new Map()] };
    }
    if (!kind) {
        // 通常の for の初期化のローカル変数 (kind を持たない宣言) と、catch の節の例外の変数
        if (Array.isArray(node.variants) && 'variantType' in node) {
            for (const variant of node.variants) {
                if (isRecord(variant)) declare(next, variant.name, node.variantType);
            }
        }
        if (node.condition === 'catch') declare(next, node.variant, node.variantType);
        return next;
    }
    const keys = keysOf(node);
    if (TYPE_DECLARATION_KINDS.has(kind)) {
        const name = str(node.name);
        const className = name
            ? context.className
                ? `${context.className}.${name}`
                : name
            : context.className;
        next = {
            ...next,
            className,
            member: className,
            memberKind: kind,
            statement: keys,
            isTest: context.isTest || apexAnnotationsOf(node).includes('istest'),
        };
        declareMembers(next, node);
        return next;
    }
    if (MEMBER_KINDS.has(kind)) {
        const name =
            str(node.name) ??
            (kind === 'constructor' ? context.className?.split('.').pop() : undefined);
        next = {
            ...next,
            member: context.className && name ? `${context.className}.${name}` : context.member,
            memberKind: kind,
            statement: keys,
            loopDepth: 0,
            nestingDepth: 0,
            inTry: false,
            isTest:
                context.isTest ||
                apexAnnotationsOf(node).includes('istest') ||
                apexAnnotationsOf(node).includes('testsetup'),
        };
        for (const param of Array.isArray(node.param) ? node.param : []) {
            if (isRecord(param)) declare(next, param.variant, param.variantType);
        }
        return next;
    }
    if (DECLARATION_KINDS.has(kind) || APEX_STATEMENT_KINDS.has(kind)) {
        next = { ...next, statement: keys ?? next.statement };
    }
    if (NESTING_KINDS.has(kind)) {
        next = {
            ...next,
            loopDepth: next.loopDepth + (LOOP_KINDS.has(kind) ? 1 : 0),
            nestingDepth: next.nestingDepth + 1,
        };
    }
    // 変数の宣言 (子の式から使う)。localVariableDeclaration は通常の for の初期化 (apex 8 からノード)
    if (kind === 'localVariable' || kind === 'localVariableDeclaration') {
        for (const variant of Array.isArray(node.variants) ? node.variants : []) {
            if (isRecord(variant)) declare(next, variant.name, node.variantType);
        }
    }
    if (kind === 'forEach') declare(next, node.variant, node.variantType);
    // catch の節の例外の変数 (apex 8 から try の節は tryClause のノード)
    if (kind === 'tryClause' && node.condition === 'catch') {
        declare(next, node.variant, node.variantType);
    }
    return next;
};

/** JSON の部分木を走査する (前順。kind を持つノードごとに visitor を呼ぶ) */
export const walkApexJson = (
    root: unknown,
    visitor: ApexVisitor,
    context: ApexWalkContext = initialApexWalkContext(),
): void => {
    const walk = (value: unknown, current: ApexWalkContext): void => {
        if (Array.isArray(value)) {
            value.forEach((item) => walk(item, current));
            return;
        }
        if (!isRecord(value)) return;
        const next = enterContext(value, current);
        if (typeof value.kind === 'string') {
            const handler = visitor[value.kind];
            if (handler && handler(value, next) === false) return;
            // 型の中身は kind を持たない
            if (value.kind === 'type') return;
            if (value.kind === 'try' && Array.isArray(value.block)) {
                // try の節だけ inTry にする
                for (const clause of value.block) {
                    const condition = isRecord(clause) ? clause.condition : undefined;
                    walk(clause, { ...next, inTry: condition === 'try' || next.inTry });
                }
                return;
            }
        }
        for (const [key, child] of Object.entries(value)) {
            if (key !== 'sourceKeys') walk(child, next);
        }
    };
    walk(root, context);
};

/** Apex の単位 (クラス・トリガー・匿名 Apex) の source.content */
export type ApexUnitContent = { unitType: string; content: Json; name?: string };

/** Apex の単位の解析結果を走査する (ソースが読めなかったものは何もしない) */
export const walkApexParseResult = (
    unit: ApexUnitParseResult,
    visitor: ApexVisitor,
    context: ApexWalkContext = initialApexWalkContext(),
): void => {
    const source = unit.result.base?.source as Json | undefined;
    const content = isRecord(source?.content) ? source!.content : undefined;
    if (!content) return;
    walkApexUnit({ unitType: String(unit.result.base.unitType), content }, visitor, context);
};

/**
 * Apex の単位を走査する。トリガーは本体 (block) を、トリガー名をメンバーにして走査する。
 * 匿名 Apex は本体 (block) を走査する
 */
export const walkApexUnit = (
    unit: ApexUnitContent,
    visitor: ApexVisitor,
    context: ApexWalkContext = initialApexWalkContext(),
): void => {
    const { unitType, content } = unit;
    if (unitType === 'trigger') {
        const name = str(content.name);
        walkApexJson(content.block, visitor, { ...context, ...(name ? { member: name } : {}) });
    } else if (unitType === 'anonymous') {
        walkApexJson(content.block, visitor, context);
    } else {
        walkApexJson(content, visitor, context);
    }
};
