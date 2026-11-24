import type {
    AccessorContentJson,
    ApexNodeJson,
    BlockMemberJson,
    ConvertKeys,
    FieldDeclarationJson,
    ModifiersJson,
    StatementJson,
    TriggerCaseJson,
    TypeJson,
} from '../../../types';
import type { ApexSourceJson } from '../../../parser';
import { walkJson } from '../../commons/node';

// Apex の宣言の一覧 (シンボル表の入力) と、実行本体の一覧 (docs/plan.md 5.1・10 章 P2)。
// - ID は宣言のノードの sourceKey (位置ごとに一意)。フィールド・ローカル変数は変数 (variant) ごと、
//   getter・setter はそれぞれの accessor のノード。for-each・catch・when の変数は、その節のノードの sourceKey
// - 名前の照合には nameKey (小文字)、表示には name (書いたまま) を使う
// - path は所有する宣言の名前の並び。先頭はクラス名・トリガー名・匿名 Apex の単位名 (ファイル名ではない)

/** 解析できた Apex のソース */
export type ParsedApexSource = Exclude<ApexSourceJson, { fileType: 'error' }>;

/** 修飾子とアノテーション (名前は書いたまま。照合は小文字で) */
export type ApexModifierInfo = {
    /** 書いたアクセス修飾子 (書いていなければ null) */
    access: 'global' | 'public' | 'protected' | 'private' | null;
    isStatic: boolean;
    isFinal: boolean;
    isAbstract: boolean;
    isVirtual: boolean;
    isOverride: boolean;
    isTransient: boolean;
    isWebService: boolean;
    /** testMethod 修飾子 */
    isTestMethod: boolean;
    /** 共有設定 (クラスのみ。書いていなければ null) */
    sharing: 'with' | 'without' | 'inherited' | null;
    /** アノテーションの名前 (書いたまま。@ は付けない) */
    annotations: string[];
};

type DeclarationBase = {
    /** 宣言の ID (宣言のノードの sourceKey) */
    id: string;
    /** 表示用の名前 (書いたまま) */
    name: string;
    /** 照合用の名前 (小文字) */
    nameKey: string;
    /** 所有する宣言の名前の並び (自分は含まない) */
    path: string[];
    /** 所有する宣言の ID (型・メソッドなど。単位の根は null) */
    ownerId: string | null;
    /** 中にある実行本体の ID (本体の外の宣言は null) */
    bodyId: string | null;
    /** 宣言のノードのキー */
    sourceKeys: ConvertKeys;
    /** 名前の位置のキー (名前の位置を別に持つ宣言のみ) */
    nameSourceKeys?: ConvertKeys;
};

/** クラス・インターフェース・enum */
export type ApexTypeDeclaration = DeclarationBase & {
    kind: 'class' | 'interface' | 'enum';
    modifiers: ApexModifierInfo;
    extends: TypeJson[];
    implements: TypeJson[];
    /** メンバーの数 (クラスは空の宣言 `;` を除くブロックの要素、インターフェースはメソッド、enum は定数) */
    memberCount: number;
    /** テストクラス (@IsTest) か */
    isTest: boolean;
};

export type ApexTriggerDeclaration = DeclarationBase & {
    kind: 'trigger';
    /** 対象の SObject */
    object: string;
    /** イベント (BEFORE INSERT など) */
    events: Pick<TriggerCaseJson, 'timing' | 'actionType'>[];
};

/** 匿名 Apex の単位 */
export type ApexAnonymousDeclaration = DeclarationBase & { kind: 'anonymous' };

export type ApexMethodDeclaration = DeclarationBase & {
    kind: 'method' | 'interfaceMethod';
    modifiers: ApexModifierInfo;
    returnType: 'void' | TypeJson;
    /** 引数の宣言の ID (書いた順) */
    parameterIds: string[];
    /** 本体を持つか (abstract・インターフェースのメソッドは持たない) */
    hasBody: boolean;
};

export type ApexConstructorDeclaration = DeclarationBase & {
    kind: 'constructor';
    modifiers: ApexModifierInfo;
    parameterIds: string[];
    /** 最初の文が this(...)・super(...) のとき、その呼び出し先 */
    delegatesTo: 'this' | 'super' | null;
};

/** 初期化ブロック (名前は 'initializer') */
export type ApexInitializerDeclaration = DeclarationBase & {
    kind: 'initializer';
    isStatic: boolean;
};

/** プロパティの get・set の有無と可視性 */
export type ApexAccessorInfo = {
    /** accessor の宣言の ID */
    id: string;
    access: ApexModifierInfo['access'];
    /** `get;`・`set;` (本体なし) か */
    isAutomatic: boolean;
};

export type ApexPropertyDeclaration = DeclarationBase & {
    kind: 'property';
    modifiers: ApexModifierInfo;
    type: TypeJson;
    getter: ApexAccessorInfo | null;
    setter: ApexAccessorInfo | null;
};

/** プロパティの getter・setter (名前はプロパティの名前。ownerId はプロパティ) */
export type ApexAccessorDeclaration = DeclarationBase & {
    kind: 'getter' | 'setter';
    modifiers: ApexModifierInfo;
    type: TypeJson;
    isAutomatic: boolean;
};

/** フィールド (変数ごと) */
export type ApexFieldDeclaration = DeclarationBase & {
    kind: 'field';
    modifiers: ApexModifierInfo;
    type: TypeJson;
    hasInitializer: boolean;
    /** static final (定数) か */
    isConstant: boolean;
    /** 同じ宣言文のノードのキー (`Integer a, b;` の a と b で同じ) */
    statementSourceKeys: ConvertKeys;
};

export type ApexEnumConstantDeclaration = DeclarationBase & {
    kind: 'enumConstant';
    /** 並び順 (0 から) */
    ordinal: number;
};

/** 実行本体の中の変数 (引数・ローカル変数・for-each・catch・when の変数) */
export type ApexVariableDeclaration = DeclarationBase & {
    kind: 'parameter' | 'localVariable' | 'forEachVariable' | 'catchVariable' | 'whenVariable';
    type: TypeJson;
    isFinal: boolean;
    hasInitializer: boolean;
    /** 見える範囲のノードの sourceKey (引数はメソッド、ローカル変数はそれを並べたブロックの持ち主、for-each・catch・when はその節) */
    scopeKey: string;
};

export type ApexDeclaration =
    | ApexTypeDeclaration
    | ApexTriggerDeclaration
    | ApexAnonymousDeclaration
    | ApexMethodDeclaration
    | ApexConstructorDeclaration
    | ApexInitializerDeclaration
    | ApexPropertyDeclaration
    | ApexAccessorDeclaration
    | ApexFieldDeclaration
    | ApexEnumConstantDeclaration
    | ApexVariableDeclaration;

export type ApexDeclarationKind = ApexDeclaration['kind'];

/** kind が K の宣言 (1 つの型が複数の kind を持つので Extract では引けない) */
export type ApexDeclarationOf<K extends ApexDeclarationKind> = ApexDeclaration & { kind: K };

/**
 * 実行本体の文。トリガー・匿名 Apex の直下の変数の宣言 (`Integer n = 1;`) は、パーサーでは field のノードになるので、
 * 書いた順を保つため文の並びに field のまま入れる (意味はローカル変数の宣言)
 */
export type ApexBodyStatementJson =
    StatementJson | (FieldDeclarationJson & { modifier: ModifiersJson });

/** 実行本体 (同じ文の解析を当てる単位) */
export type ApexExecutableBody = {
    /** 本体の ID (本体を持つ宣言の ID と同じ) */
    id: string;
    kind: 'method' | 'constructor' | 'initializer' | 'getter' | 'setter' | 'trigger' | 'anonymous';
    /** 本体を持つ宣言の名前の並び (自分を含む) */
    path: string[];
    /** 本体の文 (トリガー・匿名 Apex は、中のクラス・メソッドなどの宣言を除いた文) */
    statements: ApexBodyStatementJson[];
    /** 引数の宣言の ID */
    parameterIds: string[];
};

export type ApexDeclarations = {
    declarations: ApexDeclaration[];
    bodies: ApexExecutableBody[];
};

const ACCESS = new Set(['global', 'public', 'protected', 'private']);

/** 修飾子とアノテーションを読む */
export const apexModifierInfoOf = (
    modifiers: ModifiersJson | readonly { kind: string; name: string }[] | undefined,
): ApexModifierInfo => {
    const items = Array.isArray(modifiers)
        ? modifiers
        : [
              ...((modifiers as ModifiersJson | undefined)?.keyword ?? []),
              ...((modifiers as ModifiersJson | undefined)?.annotation ?? []),
          ];
    const keywords = new Set(
        items.filter((item) => item.kind === 'modifier').map((item) => item.name.toLowerCase()),
    );
    const access = [...keywords].find((keyword) => ACCESS.has(keyword));
    const sharing = keywords.has('with_sharing')
        ? 'with'
        : keywords.has('without_sharing')
          ? 'without'
          : keywords.has('inherited_sharing')
            ? 'inherited'
            : null;
    return {
        access: (access as ApexModifierInfo['access'] | undefined) ?? null,
        isStatic: keywords.has('static'),
        isFinal: keywords.has('final'),
        isAbstract: keywords.has('abstract'),
        isVirtual: keywords.has('virtual'),
        isOverride: keywords.has('override'),
        isTransient: keywords.has('transient'),
        isWebService: keywords.has('webservice'),
        isTestMethod: keywords.has('testmethod'),
        sharing,
        annotations: items.filter((item) => item.kind === 'annotation').map((item) => item.name),
    };
};

/** メンバーの宣言に付く修飾子 (クラスのブロック・トリガー・匿名 Apex の要素は modifier を持つ) */
const modifierOf = (node: object): ModifiersJson | undefined =>
    (node as { modifier?: ModifiersJson }).modifier;

/** トリガー・匿名 Apex のブロックの要素のうち、本体の文にしないメンバーの宣言 (変数の宣言 field は文として残す) */
const MEMBER_KINDS = new Set(['class', 'interface', 'enum', 'method', 'property', 'constructor']);

const statementsOf = (block: BlockMemberJson[]): ApexBodyStatementJson[] =>
    block.filter((member): member is ApexBodyStatementJson => !MEMBER_KINDS.has(member.kind));

/** ローカル変数が見える範囲: 変数の文を並べたブロックの持ち主 */
const SCOPE_SKIP = new Set(['localVariable', 'localVariableDeclaration', 'forControl', 'variant']);

/** 単位名 (匿名 Apex はファイル名から拡張子を除いたもの) */
const unitNameOf = (fileName: string): string => {
    const dot = fileName.lastIndexOf('.');
    return dot < 0 ? fileName : fileName.slice(0, dot);
};

type State = {
    path: string[];
    ownerId: string | null;
    bodyId: string | null;
};

/** Apex の宣言と実行本体を、書いた順に集める */
export const apexDeclarationsOf = (source: ParsedApexSource): ApexDeclarations => {
    const declarations: ApexDeclaration[] = [];
    const bodies: ApexExecutableBody[] = [];
    const root = source.content as ApexNodeJson;

    const base = (
        node: ApexNodeJson,
        name: string,
        state: State,
        nameRef?: { sourceKeys: ConvertKeys },
    ): DeclarationBase => ({
        id: node.sourceKeys.sourceKey,
        name,
        nameKey: name.toLowerCase(),
        path: state.path,
        ownerId: state.ownerId,
        bodyId: state.bodyId,
        sourceKeys: node.sourceKeys,
        ...(nameRef ? { nameSourceKeys: nameRef.sourceKeys } : {}),
    });

    /** 宣言の中に入るときの文脈 */
    const inside = (state: State, id: string, name: string, bodyId: string | null): State => ({
        path: [...state.path, name],
        ownerId: id,
        bodyId,
    });

    const addBody = (
        id: string,
        kind: ApexExecutableBody['kind'],
        path: string[],
        statements: ApexBodyStatementJson[],
        parameterIds: string[] = [],
    ) => bodies.push({ id, kind, path, statements, parameterIds });

    const parametersOf = (params: readonly { sourceKeys: ConvertKeys }[]) =>
        params.map((param) => param.sourceKeys.sourceKey);

    const variable = (
        node: ApexNodeJson,
        kind: ApexVariableDeclaration['kind'],
        name: string,
        type: TypeJson,
        state: State,
        scopeKey: string,
        extra: { isFinal?: boolean; hasInitializer?: boolean } = {},
    ) =>
        declarations.push({
            ...base(node, name, state),
            kind,
            type,
            isFinal: extra.isFinal ?? false,
            hasInitializer: extra.hasInitializer ?? false,
            scopeKey,
        });

    walkJson<ApexNodeJson, State>(
        root,
        {
            enter: {
                class: (node, { state }) => {
                    const modifiers = apexModifierInfoOf(modifierOf(node));
                    const declaration = base(node, node.name, state, node.nameRef);
                    declarations.push({
                        ...declaration,
                        kind: 'class',
                        modifiers,
                        extends: node.extend ? [node.extend] : [],
                        implements: node.implement ?? [],
                        memberCount: node.block.filter((member) => member.kind !== 'notSet').length,
                        isTest: modifiers.annotations.some((a) => a.toLowerCase() === 'istest'),
                    });
                    return { state: inside(state, declaration.id, node.name, null) };
                },
                interface: (node, { state }) => {
                    const modifiers = apexModifierInfoOf(modifierOf(node));
                    const declaration = base(node, node.name, state, node.nameRef);
                    declarations.push({
                        ...declaration,
                        kind: 'interface',
                        modifiers,
                        extends: node.extend ?? [],
                        implements: [],
                        memberCount: node.block?.length ?? 0,
                        isTest: false,
                    });
                    return { state: inside(state, declaration.id, node.name, null) };
                },
                enum: (node, { state }) => {
                    const modifiers = apexModifierInfoOf(modifierOf(node));
                    const declaration = base(node, node.name, state, node.nameRef);
                    declarations.push({
                        ...declaration,
                        kind: 'enum',
                        modifiers,
                        extends: [],
                        implements: [],
                        memberCount: node.members?.length ?? 0,
                        isTest: false,
                    });
                    node.members?.forEach((member, ordinal) =>
                        declarations.push({
                            ...base(
                                member,
                                member.name,
                                inside(state, declaration.id, node.name, null),
                            ),
                            kind: 'enumConstant',
                            ordinal,
                        }),
                    );
                    return 'skip';
                },
                triggerUnit: (node, { state }) => {
                    const declaration = base(node, node.name, state);
                    declarations.push({
                        ...declaration,
                        kind: 'trigger',
                        object: node.object,
                        events: node.case.map(({ timing, actionType }) => ({ timing, actionType })),
                    });
                    const path = [...state.path, node.name];
                    addBody(declaration.id, 'trigger', path, statementsOf(node.block));
                    return { state: { path, ownerId: declaration.id, bodyId: declaration.id } };
                },
                anonymousUnit: (node, { state }) => {
                    const name = unitNameOf(source.fileName);
                    const declaration = base(node, name, state);
                    declarations.push({ ...declaration, kind: 'anonymous' });
                    const path = [...state.path, name];
                    addBody(declaration.id, 'anonymous', path, statementsOf(node.block));
                    return { state: { path, ownerId: declaration.id, bodyId: declaration.id } };
                },
                method: (node, { state }) => {
                    const declaration = base(node, node.name, state, node.nameRef);
                    const parameterIds = parametersOf(node.param);
                    declarations.push({
                        ...declaration,
                        kind: 'method',
                        modifiers: apexModifierInfoOf(modifierOf(node)),
                        returnType: node.returnType,
                        parameterIds,
                        hasBody: node.block !== undefined,
                    });
                    const bodyId = node.block ? declaration.id : null;
                    const path = [...state.path, node.name];
                    if (node.block)
                        addBody(declaration.id, 'method', path, node.block, parameterIds);
                    return { state: inside(state, declaration.id, node.name, bodyId) };
                },
                interfaceMethod: (node, { state }) => {
                    const declaration = base(node, node.name, state, node.nameRef);
                    declarations.push({
                        ...declaration,
                        kind: 'interfaceMethod',
                        modifiers: apexModifierInfoOf(node.modifier),
                        returnType: node.returnType,
                        parameterIds: parametersOf(node.param),
                        hasBody: false,
                    });
                    return { state: inside(state, declaration.id, node.name, null) };
                },
                constructor: (node, { state }) => {
                    const name = node.name[node.name.length - 1] ?? '';
                    const declaration = base(node, name, state, node.nameRef);
                    const parameterIds = parametersOf(node.param);
                    const first = node.block[0];
                    const callee =
                        first?.kind === 'expression' && first.value.kind === 'call'
                            ? first.value.callee.kind
                            : undefined;
                    declarations.push({
                        ...declaration,
                        kind: 'constructor',
                        modifiers: apexModifierInfoOf(modifierOf(node)),
                        parameterIds,
                        delegatesTo: callee === 'this' || callee === 'super' ? callee : null,
                    });
                    const path = [...state.path, name];
                    addBody(declaration.id, 'constructor', path, node.block, parameterIds);
                    return { state: inside(state, declaration.id, name, declaration.id) };
                },
                initializer: (node, { state }) => {
                    const name = 'initializer';
                    const declaration = base(node, name, state);
                    declarations.push({
                        ...declaration,
                        kind: 'initializer',
                        isStatic: node.isStatic,
                    });
                    const path = [...state.path, name];
                    addBody(declaration.id, 'initializer', path, node.block);
                    return { state: inside(state, declaration.id, name, declaration.id) };
                },
                property: (node, { state }) => {
                    const declaration = base(node, node.name, state, node.nameRef);
                    const accessorOf = (
                        content: AccessorContentJson | undefined,
                    ): ApexAccessorInfo | null =>
                        content
                            ? {
                                  id: content.sourceKeys.sourceKey,
                                  access: apexModifierInfoOf(content.modifier).access,
                                  isAutomatic: content.block === undefined,
                              }
                            : null;
                    declarations.push({
                        ...declaration,
                        kind: 'property',
                        modifiers: apexModifierInfoOf(modifierOf(node)),
                        type: node.variantType,
                        getter: accessorOf(node.getterContent),
                        setter: accessorOf(node.setterContent),
                    });
                    return { state: inside(state, declaration.id, node.name, null) };
                },
                accessor: (node, { state, parent }) => {
                    if (parent?.kind !== 'property') return 'skip';
                    const kind = parent.getterContent === node ? 'getter' : 'setter';
                    const declaration = {
                        ...base(node, parent.name, state),
                        kind,
                        modifiers: apexModifierInfoOf(node.modifier),
                        type: parent.variantType,
                        isAutomatic: node.block === undefined,
                    } satisfies ApexAccessorDeclaration;
                    declarations.push(declaration);
                    if (!node.block) return 'skip';
                    const path = [...state.path, kind];
                    // setter の value は暗黙の引数なので、宣言には足さない
                    addBody(declaration.id, kind, path, node.block);
                    return { state: { path, ownerId: declaration.id, bodyId: declaration.id } };
                },
                variant: (node, { state, parent, parents }) => {
                    // トリガー・匿名 Apex の直下の変数は、パーサーでは field になるが、意味はローカル変数
                    const grandparent = parents[parents.length - 2];
                    if (
                        parent?.kind === 'field' &&
                        (grandparent?.kind === 'triggerUnit' ||
                            grandparent?.kind === 'anonymousUnit')
                    ) {
                        variable(
                            node,
                            'localVariable',
                            node.name,
                            parent.variantType,
                            state,
                            grandparent.sourceKeys.sourceKey,
                            {
                                isFinal: apexModifierInfoOf(modifierOf(parent)).isFinal,
                                hasInitializer: node.init !== undefined,
                            },
                        );
                        return;
                    }
                    if (parent?.kind === 'field') {
                        const modifiers = apexModifierInfoOf(modifierOf(parent));
                        declarations.push({
                            ...base(node, node.name, state),
                            kind: 'field',
                            modifiers,
                            type: parent.variantType,
                            hasInitializer: node.init !== undefined,
                            isConstant: modifiers.isStatic && modifiers.isFinal,
                            statementSourceKeys: parent.sourceKeys,
                        });
                        return;
                    }
                    if (
                        parent?.kind === 'localVariable' ||
                        parent?.kind === 'localVariableDeclaration'
                    ) {
                        const scope = [...parents].reverse().find((p) => !SCOPE_SKIP.has(p.kind));
                        variable(
                            node,
                            'localVariable',
                            node.name,
                            parent.variantType,
                            state,
                            scope?.sourceKeys.sourceKey ?? state.bodyId ?? '',
                            {
                                isFinal: apexModifierInfoOf(parent.modifier).isFinal,
                                hasInitializer: node.init !== undefined,
                            },
                        );
                    }
                },
                parameter: (node, { state }) => {
                    variable(
                        node,
                        'parameter',
                        node.variant,
                        node.variantType,
                        state,
                        state.ownerId ?? '',
                        {
                            isFinal: apexModifierInfoOf(node.modifier).isFinal,
                            hasInitializer: true,
                        },
                    );
                },
                forEach: (node, { state }) => {
                    variable(
                        node,
                        'forEachVariable',
                        node.variant,
                        node.variantType,
                        state,
                        node.sourceKeys.sourceKey,
                        { hasInitializer: true },
                    );
                },
                tryClause: (node, { state }) => {
                    if (node.condition !== 'catch') return;
                    variable(
                        node,
                        'catchVariable',
                        node.variant,
                        node.variantType,
                        state,
                        node.sourceKeys.sourceKey,
                        {
                            isFinal: apexModifierInfoOf(node.modifier).isFinal,
                            hasInitializer: true,
                        },
                    );
                },
                whenType: (node, { state, parents }) => {
                    const when = [...parents].reverse().find((p) => p.kind === 'switchWhen');
                    variable(
                        node,
                        'whenVariable',
                        node.variant,
                        node.variantType,
                        state,
                        (when ?? node).sourceKeys.sourceKey,
                        { hasInitializer: true },
                    );
                },
            },
        },
        { path: [], ownerId: null, bodyId: null },
    );

    return { declarations, bodies };
};
