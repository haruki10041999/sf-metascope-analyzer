import type { BaseExpressionJson, TypeJson } from '../../../types';
import type { ApexCallSite, ApexExpressionRef } from './call';
import type { ApexDeclaration, ApexDeclarations } from './declaration';
import { resolveApexStandardName } from './standardNames';
import type { ApexBodyAnalysis } from './statement';

// union の各要素ごとに Omit する（通常の Omit は union の共通キーしか残さない）
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

export type ApexTypeName = {
    kind: 'primitive' | 'custom';
    path: (
        | 'list'
        | 'set'
        | 'mapKey'
        | 'mapValue'
        | { type: 'array'; dimension: number }
        | { type: 'customGeneric'; index: number }
        | string[]
    )[];
    name: string;
};

const _makeApexTypeNameOf = (
    type: DistributiveOmit<TypeJson, 'kind' | 'sourceKeys'>,
    path: ApexTypeName['path'],
    apexTypeNames: ApexTypeName[],
): void => {
    if (type.type === 'primitive') {
        apexTypeNames.push({
            kind: type.type,
            path,
            name: type.primitiveType,
        });
    }

    if (type.type === 'custom') {
        apexTypeNames.push({
            kind: type.type,
            path,
            name: type.customType.join('.'),
        });

        type.generic?.forEach((g, index) => {
            _makeApexTypeNameOf(
                g,
                [...path, type.customType, { type: 'customGeneric', index: index + 1 }],
                apexTypeNames,
            );
        });
    }

    if (type.type === 'array' || type.type === 'list' || type.type === 'set') {
        _makeApexTypeNameOf(
            type.elementType,
            [
                ...path,
                type.type === 'array' ? { type: 'array', dimension: type.dimension } : type.type,
            ],
            apexTypeNames,
        );
    }

    if (type.type === 'map') {
        _makeApexTypeNameOf(type.keyType, [...path, 'mapKey'], apexTypeNames);
        _makeApexTypeNameOf(type.valueType, [...path, 'mapValue'], apexTypeNames);
    }
};

export const makeApexTypeNameOf = (type: TypeJson): ApexTypeName[] => {
    const apexTypeNames: ApexTypeName[] = [];
    _makeApexTypeNameOf(type, [], apexTypeNames);
    return apexTypeNames;
};

// ---------------------------------------------------------------------------
// 式の型の解決 (docs/plan.md 10 章 P2)。
// - 型は ApexTypeRef にそろえる。`Foo[]` と `List<Foo>`、`System.List<Foo>` は同じ list の形にする。
//   名前空間つきの名前 (`Schema.Account`) と短い名前 (`Account`) は書いたまま区別して持つ
// - 同じ単位の中の型 (クラス・内部クラス・インターフェース・enum) に当たれば、その宣言の ID を持つ
// - 標準 API は、型の構造で決まるコレクションのメソッド (要素・キー・値を返すもの) だけを表で持つ。
//   それ以外の標準のメソッド・項目は、理由つきの unknown にする (docs/plan.md 2.2)
// ---------------------------------------------------------------------------

/** 型の構造 */
export type ApexTypeRef =
    /** 基本の型 (Integer・String・Id・Object など。名前は書いたまま) */
    | { kind: 'primitive'; name: string }
    /**
     * 名前の型 (クラス・SObject・標準の型)。名前は書いたまま。
     * 同じ単位の中の型なら declarationId、標準の型・SObject なら standard を持つ
     */
    | {
          kind: 'named';
          name: string[];
          args: ApexTypeRef[];
          declarationId?: string;
          standard?: ApexStandardTypeInfo;
      }
    | { kind: 'list'; element: ApexTypeRef }
    | { kind: 'set'; element: ApexTypeRef }
    | { kind: 'map'; key: ApexTypeRef; value: ApexTypeRef }
    | { kind: 'void' }
    | { kind: 'null' }
    /** 式が型そのものを指す (`Foo.staticMethod()` の Foo) */
    | { kind: 'static'; type: ApexTypeRef & { kind: 'named' } }
    | { kind: 'unknown'; reason: ApexUnknownTypeReason; detail?: string };

/** 標準の型 (公式の完全修飾名) か、SObject (標準オブジェクトの一覧に載っているか) */
export type ApexStandardTypeInfo =
    { kind: 'type'; qualifiedName: string } | { kind: 'sObject'; listed: boolean };

/**
 * 型が分からない理由。
 * - unresolvedName: 名前が変数・メンバー・単位の中の型のどれでもない (標準の型・ほかの単位の型・名前空間など)
 * - externalMember / externalMethod: 単位の外の型 (SObject・標準の型・ほかのクラス) のメンバー・メソッド
 * - memberNotFound / methodNotFound: 単位の中の型に見つからない (継承したものなど)
 * - ambiguousOverload: 引数の数で 1 つに絞れず、戻り値の型も違う
 * - standardMember / standardMethod: 標準の型のメンバー・メソッド (標準 API はメソッドの単位で照合しない。docs/plan.md 2.2)
 * - sObjectField: SObject の項目 (`acc.Name`。項目の型はスキーマを引く参照の解決で決める)
 * - unknownReceiver: レシーバーの型が分からないので、呼び出し先を決められない (detail はレシーバーの理由とメソッド名)
 * - noSuperclass: 親クラスがない・単位の外にある
 * - expression: 演算などの式 (型を求めていない)
 */
export type ApexUnknownTypeReason =
    | 'unresolvedName'
    | 'externalMember'
    | 'externalMethod'
    | 'standardMember'
    | 'standardMethod'
    | 'sObjectField'
    | 'unknownReceiver'
    | 'memberNotFound'
    | 'methodNotFound'
    | 'ambiguousOverload'
    | 'noSuperclass'
    | 'expression';

const unknownType = (
    reason: ApexUnknownTypeReason,
    detail?: string,
): ApexTypeRef & { kind: 'unknown' } => ({
    kind: 'unknown',
    reason,
    ...(detail ? { detail } : {}),
});

/** `System.List` などの名前空間を外したコレクションの名前 (コレクションでなければ undefined) */
const collectionOf = (name: readonly string[]): 'list' | 'set' | 'map' | undefined => {
    const lower = name.map((n) => n.toLowerCase());
    const last = lower[lower.length - 1];
    if (lower.length > 2 || (lower.length === 2 && lower[0] !== 'system')) return undefined;
    return last === 'list' || last === 'set' || last === 'map' ? last : undefined;
};

/** TypeJson を型の構造にする */
export const apexTypeRefOf = (type: TypeJson | 'void'): ApexTypeRef => {
    if (type === 'void') return { kind: 'void' };
    switch (type.type) {
        case 'primitive':
            return { kind: 'primitive', name: type.primitiveType };
        case 'array': {
            let element = apexTypeRefOf(type.elementType);
            for (let i = 1; i < type.dimension; i++) element = { kind: 'list', element };
            return { kind: 'list', element };
        }
        case 'list':
        case 'set':
            return { kind: type.type, element: apexTypeRefOf(type.elementType) };
        case 'map':
            return {
                kind: 'map',
                key: apexTypeRefOf(type.keyType),
                value: apexTypeRefOf(type.valueType),
            };
        case 'custom': {
            const args = (type.generic ?? []).map(apexTypeRefOf);
            const collection = collectionOf(type.customType);
            if ((collection === 'list' || collection === 'set') && args.length === 1 && args[0]) {
                return { kind: collection, element: args[0] };
            }
            if (collection === 'map' && args.length === 2 && args[0] && args[1]) {
                return { kind: 'map', key: args[0], value: args[1] };
            }
            return { kind: 'named', name: [...type.customType], args };
        }
    }
};

/** 型の表示 (`List<Account>`・`Map<Id, Schema.Account>`) */
export const apexTypeTextOf = (type: ApexTypeRef): string => {
    switch (type.kind) {
        case 'primitive':
            return type.name;
        case 'named':
            return `${type.name.join('.')}${type.args.length ? `<${type.args.map(apexTypeTextOf).join(', ')}>` : ''}`;
        case 'list':
            return `List<${apexTypeTextOf(type.element)}>`;
        case 'set':
            return `Set<${apexTypeTextOf(type.element)}>`;
        case 'map':
            return `Map<${apexTypeTextOf(type.key)}, ${apexTypeTextOf(type.value)}>`;
        case 'static':
            return `type ${apexTypeTextOf(type.type)}`;
        case 'unknown':
            return `unknown(${type.reason}${type.detail ? `: ${type.detail}` : ''})`;
        default:
            return type.kind;
    }
};

const primitive = (name: string): ApexTypeRef => ({ kind: 'primitive', name });

/** リテラルの型 */
const LITERAL_TYPES: Readonly<Record<string, string>> = {
    string: 'String',
    integer: 'Integer',
    long: 'Long',
    decimal: 'Decimal',
    boolean: 'Boolean',
};

/**
 * コレクションのメソッドの戻り値 (型の構造で決まるもの)。
 * 名前は小文字、値は戻り値の型を作る関数 (コレクションの型を受け取る)
 */
const COLLECTION_METHODS: Readonly<
    Record<'list' | 'set' | 'map', Readonly<Record<string, (type: ApexTypeRef) => ApexTypeRef>>>
> = {
    list: {
        get: (t) => (t.kind === 'list' ? t.element : t),
        remove: (t) => (t.kind === 'list' ? t.element : t),
        clone: (t) => t,
        deepclone: (t) => t,
        size: () => primitive('Integer'),
        indexof: () => primitive('Integer'),
        isempty: () => primitive('Boolean'),
        contains: () => primitive('Boolean'),
    },
    set: {
        clone: (t) => t,
        size: () => primitive('Integer'),
        isempty: () => primitive('Boolean'),
        contains: () => primitive('Boolean'),
        containsall: () => primitive('Boolean'),
    },
    map: {
        get: (t) => (t.kind === 'map' ? t.value : t),
        remove: (t) => (t.kind === 'map' ? t.value : t),
        put: (t) => (t.kind === 'map' ? t.value : t),
        values: (t) => (t.kind === 'map' ? { kind: 'list', element: t.value } : t),
        keyset: (t) => (t.kind === 'map' ? { kind: 'set', element: t.key } : t),
        clone: (t) => t,
        deepclone: (t) => t,
        size: () => primitive('Integer'),
        isempty: () => primitive('Boolean'),
        containskey: () => primitive('Boolean'),
    },
};

/** 式の型を求める関数 (実行本体ごと) */
export type ApexTypeResolver = {
    /** 式の構造の型 */
    typeOf: (ref: ApexExpressionRef) => ApexTypeRef;
    /** 呼び出しの戻り値の型 */
    returnTypeOf: (call: ApexCallSite) => ApexTypeRef;
    /** 呼び出し先のメソッドの宣言の候補 (単位の中のもの。1 つに決まれば 1 件) */
    methodCandidatesOf: (call: ApexCallSite) => ApexDeclaration[];
};

export type ApexTypeResolverOptions = {
    /**
     * リポジトリのほかの単位に定義された型か (名前の並び)。名前空間を書かない標準の型より優先する。
     * 単位をまたぐ解決 (P3 のシンボル表) ができるまでは渡さなくてよい
     */
    isRepositoryType?: (path: readonly string[]) => boolean;
};

/**
 * 実行本体の中の式の型を求める。
 * 入力は同じ単位の宣言の一覧・本体の解析の結果・本体の呼び出しの一覧
 */
export const apexTypeResolverOf = (
    { declarations }: ApexDeclarations,
    analysis: ApexBodyAnalysis,
    calls: readonly ApexCallSite[],
    options: ApexTypeResolverOptions = {},
): ApexTypeResolver => {
    const byId = new Map(declarations.map((d) => [d.id, d]));
    const callsById = new Map(calls.map((c) => [c.id, c]));
    const typeDeclarations = declarations.filter(
        (d) => d.kind === 'class' || d.kind === 'interface' || d.kind === 'enum',
    );

    /** 本体を所有する型の並び (内側から) */
    const ownerTypes: string[] = [];
    for (let current = byId.get(analysis.body.id); current;) {
        if (current.kind === 'class' || current.kind === 'interface' || current.kind === 'enum')
            ownerTypes.push(current.id);
        current = current.ownerId ? byId.get(current.ownerId) : undefined;
    }

    /** 名前の型を、単位の中の型の宣言に当てる (名前の並びの末尾が、宣言の [パス..., 名前] の末尾と一致するもの) */
    const typeDeclarationOf = (name: readonly string[]): ApexDeclaration | undefined => {
        const wanted = name.map((n) => n.toLowerCase());
        const candidates = typeDeclarations.filter((d) => {
            const qualified = [...d.path, d.name].map((n) => n.toLowerCase());
            return (
                qualified.length >= wanted.length &&
                wanted.every((n, i) => qualified[qualified.length - wanted.length + i] === n)
            );
        });
        if (candidates.length <= 1) return candidates[0];
        // 同じ名前の内部クラスが複数あれば、本体を所有する型の中のものを優先する
        return candidates.find((d) => d.ownerId && ownerTypes.includes(d.ownerId));
    };

    /** 名前の並びを、標準の型・SObject に当てる (単位の中の型・リポジトリの型を優先する) */
    const standardOf = (path: readonly string[]) =>
        resolveApexStandardName(path, {
            isUserType: (prefix) =>
                typeDeclarationOf(prefix) !== undefined ||
                (options.isRepositoryType?.(prefix) ?? false),
        });

    /** 名前の並び全体が標準の型・SObject なら、その情報 */
    const standardTypeOf = (path: readonly string[]): ApexStandardTypeInfo | undefined => {
        const standard = standardOf(path);
        if (!standard || standard.members.length > 0) return undefined;
        if (standard.kind === 'type') {
            return { kind: 'type', qualifiedName: standard.type.qualifiedName };
        }
        if (standard.kind === 'sObject') return { kind: 'sObject', listed: standard.listed };
        return undefined;
    };

    /** 名前の型に、単位の中の宣言の ID か、標準の型の情報を付ける */
    const withDeclaration = (type: ApexTypeRef): ApexTypeRef => {
        switch (type.kind) {
            case 'named': {
                const declaration = typeDeclarationOf(type.name);
                const standard = declaration ? undefined : standardTypeOf(type.name);
                return {
                    ...type,
                    args: type.args.map(withDeclaration),
                    ...(declaration ? { declarationId: declaration.id } : {}),
                    ...(standard ? { standard } : {}),
                };
            }
            case 'list':
            case 'set':
                return { ...type, element: withDeclaration(type.element) };
            case 'map':
                return {
                    ...type,
                    key: withDeclaration(type.key),
                    value: withDeclaration(type.value),
                };
            default:
                return type;
        }
    };
    const typeRefOf = (type: TypeJson | 'void') => withDeclaration(apexTypeRefOf(type));

    const typeOfDeclaration = (declaration: ApexDeclaration | undefined): ApexTypeRef => {
        if (!declaration) return unknownType('unresolvedName');
        switch (declaration.kind) {
            case 'field':
            case 'property':
            case 'getter':
            case 'setter':
            case 'parameter':
            case 'localVariable':
            case 'forEachVariable':
            case 'catchVariable':
            case 'whenVariable':
                return typeRefOf(declaration.type);
            case 'enumConstant': {
                const owner = byId.get(declaration.ownerId ?? '');
                return owner
                    ? {
                          kind: 'named',
                          name: [...owner.path, owner.name],
                          args: [],
                          declarationId: owner.id,
                      }
                    : unknownType('unresolvedName', declaration.name);
            }
            default:
                return unknownType('expression', declaration.kind);
        }
    };

    /** 型と、同じ単位の中でたどれる親クラスの並び (自分から親の順) */
    const inheritanceOf = (typeId: string): string[] => {
        const chain: string[] = [];
        for (let current: string | undefined = typeId; current && !chain.includes(current);) {
            chain.push(current);
            const parent = superclassOf(current);
            current = parent.kind === 'named' ? parent.declarationId : undefined;
        }
        return chain;
    };

    /** 型の宣言のメンバー (フィールド・プロパティ・enum の定数・内部の型)。同じ単位の中の親クラスもたどる */
    const memberOf = (typeId: string, name: string): ApexDeclaration | undefined => {
        const key = name.toLowerCase();
        const chain = inheritanceOf(typeId);
        return declarations.find(
            (d) =>
                chain.includes(d.ownerId ?? '') &&
                d.nameKey === key &&
                (d.kind === 'field' ||
                    d.kind === 'property' ||
                    d.kind === 'enumConstant' ||
                    d.kind === 'class' ||
                    d.kind === 'interface' ||
                    d.kind === 'enum'),
        );
    };

    const staticOf = (declaration: ApexDeclaration): ApexTypeRef => ({
        kind: 'static',
        type: {
            kind: 'named',
            name: [...declaration.path, declaration.name],
            args: [],
            declarationId: declaration.id,
        },
    });

    /** 型の宣言の親クラスの型 */
    const superclassOf = (typeId: string): ApexTypeRef => {
        const declaration = byId.get(typeId);
        const extended = declaration?.kind === 'class' ? declaration.extends[0] : undefined;
        if (!extended) return unknownType('noSuperclass');
        const type = typeRefOf(extended);
        return type.kind === 'named' && type.declarationId
            ? type
            : unknownType('noSuperclass', apexTypeTextOf(type));
    };

    const thisType = (): ApexTypeRef => {
        const declaration = byId.get(ownerTypes[0] ?? '');
        return declaration
            ? {
                  kind: 'named',
                  name: [...declaration.path, declaration.name],
                  args: [],
                  declarationId: declaration.id,
              }
            : unknownType('unresolvedName', 'this');
    };

    /** メソッドを、型ごとに内側から探す。型の中で見つからなければ、同じ単位の中の親クラスをたどる */
    const methodsOf = (typeIds: readonly string[], name: string): ApexDeclaration[] => {
        const key = name.toLowerCase();
        for (const typeId of typeIds) {
            for (const owner of inheritanceOf(typeId)) {
                const found = declarations.filter(
                    (d) =>
                        d.ownerId === owner &&
                        d.nameKey === key &&
                        (d.kind === 'method' || d.kind === 'interfaceMethod'),
                );
                if (found.length > 0) return found;
            }
        }
        return [];
    };

    /** 呼び出し先を探す型の並び。単位の外の型なら、その型を返す */
    const searchTypesOf = (call: ApexCallSite): readonly string[] | ApexTypeRef => {
        if (!call.receiver) return ownerTypes;
        const receiver = typeOf(call.receiver);
        if (call.receiver.kind === 'this') return ownerTypes.slice(0, 1);
        if (receiver.kind === 'static') {
            return receiver.type.declarationId ? [receiver.type.declarationId] : receiver;
        }
        if (receiver.kind === 'named' && receiver.declarationId) return [receiver.declarationId];
        return receiver;
    };

    const methodCandidatesOf = (call: ApexCallSite): ApexDeclaration[] => {
        if (call.kind !== 'method') return [];
        const types = searchTypesOf(call);
        if (!Array.isArray(types)) return [];
        const methods = methodsOf(types as readonly string[], call.name);
        const byArity = methods.filter((m) =>
            m.kind === 'method' || m.kind === 'interfaceMethod'
                ? m.parameterIds.length === call.args.length
                : false,
        );
        return byArity;
    };

    const returnTypeOf = (call: ApexCallSite): ApexTypeRef => {
        if (call.kind === 'new')
            return call.type ? typeRefOf(call.type) : unknownType('expression');
        if (call.kind === 'constructor') return { kind: 'void' };
        const types = searchTypesOf(call);
        if (!Array.isArray(types)) {
            const receiver = types as ApexTypeRef;
            if (receiver.kind === 'list' || receiver.kind === 'set' || receiver.kind === 'map') {
                const method = COLLECTION_METHODS[receiver.kind][call.name.toLowerCase()];
                if (method) return method(receiver);
            }
            if (receiver.kind === 'unknown') {
                // 名前の並び (ほかの単位の型・名前空間など) は、並びを伸ばして残す
                if (receiver.reason === 'unresolvedName') {
                    return unknownType('unresolvedName', `${receiver.detail ?? ''}.${call.name}`);
                }
                return unknownType(
                    'unknownReceiver',
                    `${receiver.reason}${receiver.detail ? `: ${receiver.detail}` : ''} → ${call.name}`,
                );
            }
            const named = receiver.kind === 'static' ? receiver.type : receiver;
            if (named.kind === 'named' && named.standard) {
                return unknownType('standardMethod', `${standardTextOf(named)}.${call.name}`);
            }
            return unknownType('externalMethod', `${apexTypeTextOf(receiver)}.${call.name}`);
        }
        const candidates = methodCandidatesOf(call);
        if (candidates.length === 0) return unknownType('methodNotFound', call.name);
        const returnTypes = candidates.map((m) =>
            m.kind === 'method' || m.kind === 'interfaceMethod'
                ? typeRefOf(m.returnType)
                : unknownType('expression'),
        );
        const texts = new Set(returnTypes.map(apexTypeTextOf));
        return texts.size === 1 && returnTypes[0]
            ? returnTypes[0]
            : unknownType('ambiguousOverload', call.name);
    };

    const typeOfExpression = (expression: BaseExpressionJson): ApexTypeRef => {
        const literal = LITERAL_TYPES[expression.kind];
        if (literal) return primitive(literal);
        switch (expression.kind) {
            case 'null':
                return { kind: 'null' };
            case 'soql': {
                const object = expression.from.field[0]?.field ?? [];
                return {
                    kind: 'list',
                    element: withDeclaration({ kind: 'named', name: object, args: [] }),
                };
            }
            case 'sosl':
                return {
                    kind: 'list',
                    element: {
                        kind: 'list',
                        element: { kind: 'named', name: ['SObject'], args: [] },
                    },
                };
            case 'instanceof':
            case 'logical':
                return primitive('Boolean');
            default:
                return unknownType('expression', expression.kind);
        }
    };

    /** 名前の並び全体が標準の型・SObject なら、その型そのもの (静的な参照) */
    const standardStaticOf = (path: readonly string[]): ApexTypeRef | undefined => {
        const standard = standardTypeOf(path);
        return standard
            ? { kind: 'static', type: { kind: 'named', name: [...path], args: [], standard } }
            : undefined;
    };

    /** 標準の型の表示 (公式の完全修飾名。SObject は書いた名前) */
    const standardTextOf = (type: ApexTypeRef & { kind: 'named' }): string =>
        type.standard?.kind === 'type' ? type.standard.qualifiedName : type.name.join('.');

    const typeOf = (ref: ApexExpressionRef): ApexTypeRef => {
        switch (ref.kind) {
            case 'name': {
                const target = ref.target;
                if (target.kind === 'variable' || target.kind === 'member') {
                    return typeOfDeclaration(byId.get(target.declarationId));
                }
                if (target.kind === 'implicit') {
                    // setter の value はプロパティの型
                    return typeOfDeclaration(byId.get(analysis.body.id));
                }
                // 単位の中の型の名前なら、型そのもの。次に標準の型・SObject
                const declaration = typeDeclarationOf([ref.name]);
                if (declaration) return staticOf(declaration);
                return standardStaticOf([ref.name]) ?? unknownType('unresolvedName', ref.name);
            }
            case 'this':
                return thisType();
            case 'super':
                return superclassOf(ownerTypes[0] ?? '');
            case 'member': {
                const object = typeOf(ref.object);
                const typeId =
                    object.kind === 'static'
                        ? object.type.declarationId
                        : object.kind === 'named'
                          ? object.declarationId
                          : undefined;
                if (typeId) {
                    const member = memberOf(typeId, ref.member);
                    if (!member) return unknownType('memberNotFound', ref.member);
                    return member.kind === 'class' ||
                        member.kind === 'interface' ||
                        member.kind === 'enum'
                        ? staticOf(member)
                        : typeOfDeclaration(member);
                }
                // 標準の型の静的なメンバー・入れ子の型 (`Schema.Account`・`Messaging.InboundEmail.Header`)
                if (object.kind === 'static' && object.type.standard) {
                    const path = [...object.type.name, ref.member];
                    return (
                        standardStaticOf(path) ??
                        unknownType(
                            'standardMember',
                            `${standardTextOf(object.type)}.${ref.member}`,
                        )
                    );
                }
                if (object.kind === 'unknown' && object.reason === 'unresolvedName') {
                    // 名前の並び (`ns.Type`) は、並び全体で標準の型を探す。なければ解決しない名前として残す
                    const path = [...(object.detail ?? '').split('.'), ref.member];
                    return standardStaticOf(path) ?? unknownType('unresolvedName', path.join('.'));
                }
                if (object.kind === 'unknown') return object;
                if (object.kind === 'named' && object.standard?.kind === 'sObject') {
                    return unknownType('sObjectField', `${object.name.join('.')}.${ref.member}`);
                }
                if (object.kind === 'named' && object.standard) {
                    return unknownType('standardMember', `${standardTextOf(object)}.${ref.member}`);
                }
                return unknownType('externalMember', `${apexTypeTextOf(object)}.${ref.member}`);
            }
            case 'index': {
                const object = typeOf(ref.object);
                if (object.kind === 'list') return object.element;
                return object.kind === 'unknown'
                    ? object
                    : unknownType('externalMember', `${apexTypeTextOf(object)}[]`);
            }
            case 'call': {
                const call = callsById.get(ref.callId);
                return call ? returnTypeOf(call) : unknownType('expression', 'call');
            }
            case 'new':
                return typeRefOf(ref.type);
            case 'cast':
                return typeRefOf(ref.type);
            case 'expression':
                return typeOfExpression(ref.expression);
        }
    };

    return { typeOf, returnTypeOf, methodCandidatesOf };
};
