import {
    AccessorContentJson,
    ClassDeclarationJson,
    ConstructorDeclarationJson,
    ConvertKeys,
    EnumConstantJson,
    EnumDeclarationJson,
    FieldDeclarationJson,
    InitializerBlockJson,
    InterfaceDeclarationJson,
    InterfaceMethodJson,
    MethodDeclarationJson,
    ModifiersJson,
    NotSetBlockJson,
    ParameterJson,
    PropertyDeclarationJson,
    TypeJson,
    VariantJson,
} from '../../../types';

import {
    Body,
    Identity,
    JsonNode,
    ListItemDiff,
    Match,
    NodeDiff,
    OptionalDiff,
    Pairing,
    SourceKeysDiff,
    Sources,
    ValueDiff,
    getObjectKey,
    getValueKey,
    makeDistance,
    makeKeyedDiff,
    makeNodeDiff,
    makeOptionalDiff,
    makeSequenceDiff,
    makeSourceKeysDiff,
    makeValueDiff,
    orderUnorderedPairings,
    pairAsSequence,
    pairAsSet,
    pairByKey,
    remapPairings,
    toBody,
} from '../../commons/diff/commons';
import { BaseExpressionJsonDiff, makeExpressionDiff } from './expression';
import { makeBlockTree } from './gumtree/tree';
import { ParametersDiff, makeParametersDiff } from './param';
import { ModifiersJsonDiff, makeModifierDiff, makeTypedModifierJsons } from './modifier';
import {
    BlockDiff,
    LocalVariableDeclarationJsonDiff,
    Statement,
    VariantJsonDiff,
    getStatementKey,
    makeBlockDiff,
} from './statement';
import {
    TypeJsonDiff,
    TypeWithVoidDiff,
    TypesDiff,
    getTypeKey,
    makeTypeDiff,
    makeTypeWithVoidDiff,
    makeTypesDiff,
} from './type';
import {
    TypedListItemDiff,
    makePairedItem,
    makeSingleItem,
    makeUnchangedItem,
} from '../../commons/diff/list';

// 方針: docs/apex-implementation.md

// ---------------------------------------------------------------------------
// 識別キー
// ---------------------------------------------------------------------------

/** パラメータ型の並び */
export const getParamTypesKey = (param: ParameterJson[] | undefined): string =>
    (param ?? []).map((p) => getTypeKey(p.variantType)).join(',');

/** メソッドの識別キー `名前(型,型,...)`。オーバーロードを区別するため、パラメータ名は含めない */
export const getSignatureKey = (name: string, param: ParameterJson[] | undefined): string =>
    `${name}(${getParamTypesKey(param)})`;

export type ClassBodyItemJson = ClassDeclarationJson['block'][number];

/** クラス本文のうち、名前で対応付けるメンバー */
export type ClassMemberJson = Exclude<ClassBodyItemJson, InitializerBlockJson | NotSetBlockJson>;

/** クラスメンバーの識別キー。kind を先頭に付けるので、対応付いた組は必ず同じ kind になる */
export const getMemberKey = (member: ClassMemberJson): string => {
    const withKind = (key: string) => `${member.kind}:${key}`;

    switch (member.kind) {
        case 'method':
            return withKind(getSignatureKey(member.name, member.param));
        case 'constructor':
            // 名前はクラス名と同じはずなのでキーに入れない
            return withKind(`(${getParamTypesKey(member.param)})`);
        case 'field':
            return withKind(member.variants.map((v) => v.name).join(','));
        default:
            return withKind(member.name);
    }
};

const getModifiersKey = (modifier: ModifiersJson): string => {
    return makeTypedModifierJsons(modifier).map(getObjectKey).sort().join(',');
};

/**
 * クラスメンバーの判定キー。メンバーの修飾子は宣言ノードの外にあり objectKey に含まれないので、
 * 修飾子の objectKey も足す (修飾子だけの変更を unchanged にしないため)。
 */
export const getMemberIdentity = (member: JsonNode & { modifier?: ModifiersJson }): string => {
    return `${getObjectKey(member)}|${getModifiersKey(member.modifier ?? {})}`;
};

/** 初期化ブロックの判定キー。sourceKeys を持たないので、中身の objectKey から作る */
export const getInitializerKey = (initializer: InitializerBlockJson): string => {
    return [
        initializer.isStatic ? 'static' : '',
        getModifiersKey(initializer.modifier),
        initializer.block.map(getStatementKey).join(','),
    ].join('|');
};

export type EnumConstantJsonDiff = NodeDiff<
    'enumConstant',
    EnumConstantJson,
    { name: ValueDiff<string> }
>;

export const makeEnumConstantDiff = (
    before: EnumConstantJson,
    after: EnumConstantJson,
    match: Match = 'slot',
): EnumConstantJsonDiff => {
    return makeNodeDiff('enumConstant', before, after, match, (b, a) => ({
        name: makeValueDiff(b.name, a.name),
    }));
};

/** enum 定数は ordinal() が並び順で決まるので C. 順序付き列 */
export type EnumConstantsDiff = ListItemDiff<
    'enumConstant',
    EnumConstantJson,
    EnumConstantJsonDiff
>;

export const makeEnumConstantsDiff = (
    before: EnumConstantJson[],
    after: EnumConstantJson[],
    sources?: Sources,
): EnumConstantsDiff[] => {
    return makeSequenceDiff('enumConstant', before, after, makeEnumConstantDiff, { sources });
};

export type EnumDeclarationJsonDiff = NodeDiff<
    'enum',
    EnumDeclarationJson,
    {
        name: ValueDiff<string>;
        members: EnumConstantsDiff[];
    }
>;

export const makeEnumDiff = (
    before: EnumDeclarationJson,
    after: EnumDeclarationJson,
    match: Match = 'slot',
    sources?: Sources,
    identity?: Identity<EnumDeclarationJson>,
): EnumDeclarationJsonDiff => {
    return makeNodeDiff(
        'enum',
        before,
        after,
        match,
        (b, a) => ({
            name: makeValueDiff(b.name, a.name),
            members: makeEnumConstantsDiff(b.members ?? [], a.members ?? [], sources),
        }),
        identity,
    );
};

type Init = NonNullable<VariantJson['init']>;

/**
 * field の変数。VariantJson は kind / sourceKeys を持たないので、ListItemDiff ではなく型付きリストの要素にする。
 * 初期値の式は makeExpressionDiff で比べる。対応付けの判定キーには式を木にした hash を使う。
 */
export type FieldVariantDiff = TypedListItemDiff<
    VariantJson,
    {
        status: 'changed';
        name: ValueDiff<string>;
        init: OptionalDiff<Init, BaseExpressionJsonDiff>;
    }
>;

// 式は kind を持たないものが多く、JSON のままだと中の sourceKeys (位置) が入るので木の hash を使う
const getVariantKey = (variant: VariantJson): string =>
    `${getValueKey(variant.name)}=${variant.init === undefined ? '' : makeBlockTree([variant.init]).hash}`;

const getVariantId = (variant: VariantJson): string => variant.name;

/** 変数は D. キー対応 (キー: 変数名) */
const makeVariantsDiff = (
    before: VariantJson[],
    after: VariantJson[],
    sources?: Sources,
): FieldVariantDiff[] => {
    const pairings = pairByKey(
        before.map(getVariantId),
        after.map(getVariantId),
        before.map(getVariantKey),
        after.map(getVariantKey),
    );

    return pairings.map((p): FieldVariantDiff => {
        if (p.status === 'removed') {
            return makeSingleItem('removed', before[p.before]!, p.before);
        }
        if (p.status === 'added') {
            return makeSingleItem('added', after[p.after]!, p.after);
        }

        const b = before[p.before]!;
        const a = after[p.after]!;
        const index = { before: p.before, after: p.after };
        if (p.status !== 'changed') {
            return makeUnchangedItem(b, a, p.match, index);
        }
        return makePairedItem(
            {
                status: 'changed' as const,
                name: makeValueDiff(b.name, a.name),
                init: makeOptionalDiff(b.init, a.init, (bi, ai) =>
                    makeExpressionDiff(bi, ai, sources),
                ),
            },
            'changed',
            p.match,
            index,
        );
    });
};

export type FieldDeclarationJsonDiff = NodeDiff<
    'field',
    FieldDeclarationJson,
    {
        variantType: TypeJsonDiff;
        variants: FieldVariantDiff[];
    }
>;

export const makeFieldDeclarationDiff = (
    before: FieldDeclarationJson,
    after: FieldDeclarationJson,
    match: Match = 'slot',
    sources?: Sources,
    identity?: Identity<FieldDeclarationJson>,
): FieldDeclarationJsonDiff => {
    return makeNodeDiff(
        'field',
        before,
        after,
        match,
        (b, a) => ({
            variantType: makeTypeDiff(b.variantType, a.variantType),
            variants: makeVariantsDiff(b.variants, a.variants, sources),
        }),
        identity,
    );
};

export type InterfaceMethodJsonDiff = NodeDiff<
    'interfaceMethod',
    InterfaceMethodJson,
    {
        name: ValueDiff<string>;
        returnType: TypeWithVoidDiff;
        param: ParametersDiff[];
        modifier: ModifiersJsonDiff;
    }
>;

export const makeInterfaceMethodDiff = (
    before: InterfaceMethodJson,
    after: InterfaceMethodJson,
    match: Match = 'slot',
    sources?: Sources,
): InterfaceMethodJsonDiff => {
    return makeNodeDiff('interfaceMethod', before, after, match, (b, a) => ({
        name: makeValueDiff(b.name, a.name),
        returnType: makeTypeWithVoidDiff(b.returnType, a.returnType),
        param: makeParametersDiff(b.param ?? [], a.param ?? [], sources),
        modifier: makeModifierDiff(b.modifier, a.modifier),
    }));
};

/** interface のメソッドの識別キー。オーバーロードを区別するため、名前とパラメータ型の並びを使う */
export const getInterfaceMethodKey = (target: InterfaceMethodJson): string =>
    getSignatureKey(target.name, target.param);

/** interface の本文は D. キー対応 */
export type InterfaceMethodsDiff = ListItemDiff<
    'interfaceMethod',
    InterfaceMethodJson,
    InterfaceMethodJsonDiff
>;

export const makeInterfaceMethodsDiff = (
    before: InterfaceMethodJson[],
    after: InterfaceMethodJson[],
    sources?: Sources,
): InterfaceMethodsDiff[] => {
    return makeKeyedDiff(
        'interfaceMethod',
        before,
        after,
        (b, a, match) => makeInterfaceMethodDiff(b, a, match, sources),
        getInterfaceMethodKey,
        sources,
    );
};

export type InterfaceDeclarationJsonDiff = NodeDiff<
    'interface',
    InterfaceDeclarationJson,
    {
        name: ValueDiff<string>;
        extend: TypesDiff[];
        block: InterfaceMethodsDiff[];
    }
>;

export const makeInterfaceDiff = (
    before: InterfaceDeclarationJson,
    after: InterfaceDeclarationJson,
    match: Match = 'slot',
    sources?: Sources,
    identity?: Identity<InterfaceDeclarationJson>,
): InterfaceDeclarationJsonDiff => {
    return makeNodeDiff(
        'interface',
        before,
        after,
        match,
        (b, a) => ({
            name: makeValueDiff(b.name, a.name),
            extend: makeTypesDiff(b.extend ?? [], a.extend ?? [], sources),
            block: makeInterfaceMethodsDiff(b.block ?? [], a.block ?? [], sources),
        }),
        identity,
    );
};

/** block が無いのは abstract など本体のない宣言 (空の本体 `{ }` とは別物) */
export type MethodDeclarationJsonDiff = NodeDiff<
    'method',
    MethodDeclarationJson,
    {
        name: ValueDiff<string>;
        returnType: TypeWithVoidDiff;
        param: ParametersDiff[];
        block: OptionalDiff<Statement[], BlockDiff>;
    }
>;

export const makeMethodDiff = (
    before: MethodDeclarationJson,
    after: MethodDeclarationJson,
    match: Match = 'slot',
    sources?: Sources,
    identity?: Identity<MethodDeclarationJson>,
): MethodDeclarationJsonDiff => {
    return makeNodeDiff(
        'method',
        before,
        after,
        match,
        (b, a) => ({
            name: makeValueDiff(b.name, a.name),
            returnType: makeTypeWithVoidDiff(b.returnType, a.returnType),
            param: makeParametersDiff(b.param ?? [], a.param ?? [], sources),
            block: makeOptionalDiff(b.block, a.block, (bb, ab) => makeBlockDiff(bb, ab, sources)),
        }),
        identity,
    );
};

export type ConstructorDeclarationJsonDiff = NodeDiff<
    'constructor',
    ConstructorDeclarationJson,
    {
        name: ValueDiff<ConstructorDeclarationJson['name']>;
        param: ParametersDiff[];
        block: BlockDiff;
    }
>;

export const makeConstructorDiff = (
    before: ConstructorDeclarationJson,
    after: ConstructorDeclarationJson,
    match: Match = 'slot',
    sources?: Sources,
    identity?: Identity<ConstructorDeclarationJson>,
): ConstructorDeclarationJsonDiff => {
    return makeNodeDiff(
        'constructor',
        before,
        after,
        match,
        (b, a) => ({
            // 修飾名は配列ごと値として比べる
            name: makeValueDiff(b.name, a.name),
            param: makeParametersDiff(b.param ?? [], a.param ?? [], sources),
            block: makeBlockDiff(b.block, a.block, sources),
        }),
        identity,
    );
};

/** get / set の中身。block が無いのは `get;` の自動実装 (空の本体 `get { }` とは別物) */
export type AccessorContentJsonDiff = {
    block: OptionalDiff<Statement[], BlockDiff>;
    modifier: ModifiersJsonDiff;
};

export const makeAccessorContentDiff = (
    before: AccessorContentJson,
    after: AccessorContentJson,
    sources?: Sources,
): AccessorContentJsonDiff => {
    return {
        block: makeOptionalDiff(before.block, after.block, (bb, ab) =>
            makeBlockDiff(bb, ab, sources),
        ),
        modifier: makeModifierDiff(before.modifier, after.modifier),
    };
};

/** isGetter / isSetter は getterContent / setterContent の有無と同じ情報なので持たない */
export type PropertyDeclarationJsonDiff = NodeDiff<
    'property',
    PropertyDeclarationJson,
    {
        name: ValueDiff<string>;
        variantType: TypeJsonDiff;
        getterContent: OptionalDiff<AccessorContentJson, AccessorContentJsonDiff>;
        setterContent: OptionalDiff<AccessorContentJson, AccessorContentJsonDiff>;
    }
>;

export const makePropertyDiff = (
    before: PropertyDeclarationJson,
    after: PropertyDeclarationJson,
    match: Match = 'slot',
    sources?: Sources,
    identity?: Identity<PropertyDeclarationJson>,
): PropertyDeclarationJsonDiff => {
    return makeNodeDiff(
        'property',
        before,
        after,
        match,
        (b, a) => ({
            name: makeValueDiff(b.name, a.name),
            variantType: makeTypeDiff(b.variantType, a.variantType),
            getterContent: makeOptionalDiff(b.getterContent, a.getterContent, (bg, ag) =>
                makeAccessorContentDiff(bg, ag, sources),
            ),
            setterContent: makeOptionalDiff(b.setterContent, a.setterContent, (bs, as) =>
                makeAccessorContentDiff(bs, as, sources),
            ),
        }),
        identity,
    );
};

// ---------------------------------------------------------------------------
// 初期化ブロック
// ---------------------------------------------------------------------------

/** 初期化ブロックは sourceKeys を持たないので、NodeDiff ではなく専用の形にする */
export type InitializerBlockJsonDiff = { kind: 'initializer' } & (
    | { status: 'unchanged'; value: Body<InitializerBlockJson> }
    | {
          status: 'changed';
          match: Match;
          fields: {
              isStatic: ValueDiff<boolean>;
              modifier: ModifiersJsonDiff;
              block: BlockDiff;
          };
      }
);

export const makeInitializerDiff = (
    before: InitializerBlockJson,
    after: InitializerBlockJson,
    match: Match = 'slot',
    sources?: Sources,
): InitializerBlockJsonDiff => {
    if (getInitializerKey(before) === getInitializerKey(after)) {
        const { kind: _kind, ...value } = before;
        return { kind: 'initializer', status: 'unchanged', value };
    }

    return {
        kind: 'initializer',
        status: 'changed',
        match,
        fields: {
            isStatic: makeValueDiff(before.isStatic, after.isStatic),
            modifier: makeModifierDiff(before.modifier, after.modifier),
            block: makeBlockDiff(before.block, after.block, sources),
        },
    };
};

// ---------------------------------------------------------------------------
// クラスメンバー
// ---------------------------------------------------------------------------

/**
 * クラスメンバーの差分。メンバーの修飾子は宣言ノードの外にあるので、fields には入れず外側に持つ。
 * 判定キーに修飾子を含めるので、修飾子だけが変わったものは fields がすべて unchanged の changed になる。
 */
export type MemberDeclarationJsonDiff = (
    | MethodDeclarationJsonDiff
    | ConstructorDeclarationJsonDiff
    | PropertyDeclarationJsonDiff
    | FieldDeclarationJsonDiff
    | ClassDeclarationJsonDiff
    | InterfaceDeclarationJsonDiff
    | EnumDeclarationJsonDiff
) & { modifier: ModifiersJsonDiff };

/** before / after は getMemberKey で対応付いた (= 同じ kind の) メンバー */
export const makeClassMemberDiff = (
    before: ClassMemberJson,
    after: ClassMemberJson,
    match: Match = 'slot',
    sources?: Sources,
): MemberDeclarationJsonDiff => {
    const identity = getMemberIdentity;
    const modifier = makeModifierDiff(before.modifier, after.modifier);

    switch (before.kind) {
        case 'method':
            return {
                ...makeMethodDiff(before, after as typeof before, match, sources, identity),
                modifier,
            };
        case 'constructor':
            return {
                ...makeConstructorDiff(before, after as typeof before, match, sources, identity),
                modifier,
            };
        case 'property':
            return {
                ...makePropertyDiff(before, after as typeof before, match, sources, identity),
                modifier,
            };
        case 'field':
            return {
                ...makeFieldDeclarationDiff(
                    before,
                    after as typeof before,
                    match,
                    sources,
                    identity,
                ),
                modifier,
            };
        case 'class':
            return {
                ...makeClassDiff(before, after as typeof before, match, sources, identity),
                modifier,
            };
        case 'interface':
            return {
                ...makeInterfaceDiff(before, after as typeof before, match, sources, identity),
                modifier,
            };
        case 'enum':
            return {
                ...makeEnumDiff(before, after as typeof before, match, sources, identity),
                modifier,
            };
    }
};

// ---------------------------------------------------------------------------
// クラス本文
// ---------------------------------------------------------------------------

type Index = { before: number; after: number };

/** notSet は集合なので unchanged だけ */
type UnchangedOtherDiff = {
    kind: NotSetBlockJson['kind'];
    status: 'unchanged';
    sourceKeys: SourceKeysDiff<ConvertKeys>;
    value: Body<NotSetBlockJson>;
};

export type ClassBodyDiff =
    | ((MemberDeclarationJsonDiff | InitializerBlockJsonDiff | UnchangedOtherDiff) & {
          index: Index;
      })
    | {
          // 順序付き列で比べる初期化ブロックだけが moved になる
          kind: 'initializer';
          status: 'moved';
          match: Match;
          index: Index;
          value: Body<InitializerBlockJson>;
      }
    | {
          kind: ClassBodyItemJson['kind'];
          status: 'added' | 'removed';
          index: number;
          // 初期化ブロックは sourceKeys を持たない
          sourceKeys?: ConvertKeys | ClassMemberJson['sourceKeys'];
          value: Body<ClassBodyItemJson>;
      };

type Group = 'member' | 'initializer' | 'other';

const getGroup = (item: ClassBodyItemJson): Group => {
    if (item.kind === 'initializer') {
        return 'initializer';
    }
    return item.kind === 'notSet' ? 'other' : 'member';
};

const splitItem = (item: ClassBodyItemJson) => {
    if (item.kind === 'initializer') {
        const { kind, ...value } = item;
        return { kind, value };
    }
    return { kind: item.kind, sourceKeys: item.sourceKeys, value: toBody(item) };
};

/**
 * クラス本文。名前のあるメンバーは D (キー: getMemberKey)、初期化ブロックは C、notSet は B で比べ、
 * before の index 順のあとに added を置いて 1 つの配列にまとめる。メンバーの並び順の変化は報告しない。
 */
export const makeClassBodyDiff = (
    before: ClassBodyItemJson[],
    after: ClassBodyItemJson[],
    sources?: Sources,
): ClassBodyDiff[] => {
    const indexOf = (list: ClassBodyItemJson[], group: Group) =>
        list.map((_, index) => index).filter((index) => getGroup(list[index]!) === group);
    const pick = <T extends ClassBodyItemJson>(list: ClassBodyItemJson[], index: number[]) =>
        index.map((i) => list[i] as T);

    const memberIndex = { before: indexOf(before, 'member'), after: indexOf(after, 'member') };
    const members = {
        before: pick<ClassMemberJson>(before, memberIndex.before),
        after: pick<ClassMemberJson>(after, memberIndex.after),
    };
    const initializerIndex = {
        before: indexOf(before, 'initializer'),
        after: indexOf(after, 'initializer'),
    };
    const initializers = {
        before: pick<InitializerBlockJson>(before, initializerIndex.before),
        after: pick<InitializerBlockJson>(after, initializerIndex.after),
    };
    const otherIndex = { before: indexOf(before, 'other'), after: indexOf(after, 'other') };
    const others = {
        before: pick<NotSetBlockJson>(before, otherIndex.before),
        after: pick<NotSetBlockJson>(after, otherIndex.after),
    };

    const pairings: Pairing[] = orderUnorderedPairings([
        ...remapPairings(
            pairByKey(
                members.before.map(getMemberKey),
                members.after.map(getMemberKey),
                members.before.map(getMemberIdentity),
                members.after.map(getMemberIdentity),
                makeDistance(members.before, members.after, sources),
            ),
            memberIndex.before,
            memberIndex.after,
        ),
        ...remapPairings(
            pairAsSequence(
                initializers.before.map(getInitializerKey),
                initializers.after.map(getInitializerKey),
            ),
            initializerIndex.before,
            initializerIndex.after,
        ),
        ...remapPairings(
            pairAsSet(
                others.before.map(getObjectKey),
                others.after.map(getObjectKey),
                makeDistance(others.before, others.after, sources),
            ),
            otherIndex.before,
            otherIndex.after,
        ),
    ]);

    return pairings.map((p): ClassBodyDiff => {
        if (p.status === 'removed') {
            const { value, ...keys } = splitItem(before[p.before]!);
            return { ...keys, status: 'removed', index: p.before, value };
        }
        if (p.status === 'added') {
            const { value, ...keys } = splitItem(after[p.after]!);
            return { ...keys, status: 'added', index: p.after, value };
        }

        const b = before[p.before]!;
        const a = after[p.after]!;
        const index = { before: p.before, after: p.after };

        if (b.kind === 'initializer' && a.kind === 'initializer') {
            if (p.status === 'moved') {
                const { kind: _kind, ...value } = b;
                return { kind: 'initializer', status: 'moved', match: p.match, index, value };
            }
            return { ...makeInitializerDiff(b, a, p.match, sources), index };
        }

        if (getGroup(b) === 'other') {
            const other = b as NotSetBlockJson;
            return {
                kind: other.kind,
                status: 'unchanged',
                sourceKeys: makeSourceKeysDiff<ConvertKeys>(
                    other.sourceKeys,
                    (a as typeof other).sourceKeys,
                ),
                value: toBody(other),
                index,
            };
        }

        return {
            ...makeClassMemberDiff(b as ClassMemberJson, a as ClassMemberJson, p.match, sources),
            index,
        };
    });
};

// ---------------------------------------------------------------------------
// クラス
// ---------------------------------------------------------------------------

// ClassBodyDiff が ClassDeclarationJsonDiff を含むので、循環を interface で切る
export interface ClassFields {
    name: ValueDiff<string>;
    extend: OptionalDiff<TypeJson, TypeJsonDiff>;
    implement: TypesDiff[];
    block: ClassBodyDiff[];
}

export type ClassDeclarationJsonDiff = NodeDiff<'class', ClassDeclarationJson, ClassFields>;

/** notSet は objectKey だけで比べる (クラス本文の中では B. 集合) */
export type NotSetBlockJsonDiff = NodeDiff<'notSet', NotSetBlockJson, undefined>;

export const makeClassDiff = (
    before: ClassDeclarationJson,
    after: ClassDeclarationJson,
    match: Match = 'slot',
    sources?: Sources,
    identity?: Identity<ClassDeclarationJson>,
): ClassDeclarationJsonDiff => {
    return makeNodeDiff(
        'class',
        before,
        after,
        match,
        (b, a): ClassFields => ({
            name: makeValueDiff(b.name, a.name),
            extend: makeOptionalDiff(b.extend, a.extend, (be, ae) => makeTypeDiff(be, ae)),
            implement: makeTypesDiff(b.implement ?? [], a.implement ?? [], sources),
            block: makeClassBodyDiff(b.block, a.block, sources),
        }),
        identity,
    );
};
