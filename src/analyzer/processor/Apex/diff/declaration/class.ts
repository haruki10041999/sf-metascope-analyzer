import {
    ClassDeclarationJson,
    ConvertKeys,
    ErrorJson,
    InitializerBlockJson,
    NotSetBlockJson,
    TypeJson,
} from '../../../../types';

import {
    Body,
    Identity,
    ListOrErrorDiff,
    Match,
    NodeDiff,
    OptionalDiff,
    Pairing,
    Sources,
    ValueDiff,
    getObjectKey,
    makeDistance,
    makeListOrErrorDiff,
    makeNodeDiff,
    makeOptionalDiff,
    makeValueDiff,
    orderUnorderedPairings,
    pairAsSequence,
    pairAsSet,
    pairByKey,
    remapPairings,
    toBody,
} from '../commons';
import { ModifierDiff, makeModifierDiff } from '../modifier';
import { TypeDiff, TypesDiff, makeTypeDiff, makeTypesDiff } from '../type';
import {
    BlockDiff,
    ClassBodyItemJson,
    ClassMemberJson,
    getInitializerKey,
    getMemberIdentity,
    getMemberKey,
    makeBlockDiff,
} from './commons';
import { EnumDiff, makeEnumDiff } from './enum';
import { FieldDiff, makeFieldDiff } from './field';
import { InterfaceDiff, makeInterfaceDiff } from './interface';
import { ConstructorDiff, MethodDiff, makeConstructorDiff, makeMethodDiff } from './method';
import { PropertyDiff, makePropertyDiff } from './property';

// ---------------------------------------------------------------------------
// 初期化ブロック
// ---------------------------------------------------------------------------

/** 初期化ブロックは sourceKeys を持たないので、NodeDiff ではなく専用の形にする */
export type InitializerDiff = { kind: 'initializer' } & (
    | { status: 'unchanged'; value: Body<InitializerBlockJson> }
    | {
          status: 'changed';
          match: Match;
          fields: {
              isStatic: ValueDiff<boolean>;
              modifier: ModifierDiff[];
              block: BlockDiff;
          };
      }
);

export const makeInitializerDiff = (
    before: InitializerBlockJson,
    after: InitializerBlockJson,
    match: Match = 'slot',
    sources?: Sources,
): InitializerDiff => {
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
export type ClassMemberDiff = (
    MethodDiff | ConstructorDiff | PropertyDiff | FieldDiff | ClassDiff | InterfaceDiff | EnumDiff
) & { modifier: ModifierDiff[] };

/** before / after は getMemberKey で対応付いた (= 同じ kind の) メンバー */
export const makeClassMemberDiff = (
    before: ClassMemberJson,
    after: ClassMemberJson,
    match: Match = 'slot',
    sources?: Sources,
): ClassMemberDiff => {
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
                ...makeFieldDiff(before, after as typeof before, match, sources, identity),
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

/** ErrorJson / notSet は集合なので unchanged だけ */
type UnchangedOtherDiff = {
    kind: (NotSetBlockJson | ErrorJson)['kind'];
    status: 'unchanged';
    sourceKeys: { before: ConvertKeys; after: ConvertKeys };
    value: Body<NotSetBlockJson | ErrorJson>;
};

export type ClassBodyDiff =
    | ((ClassMemberDiff | InitializerDiff | UnchangedOtherDiff) & { index: Index })
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
    return item.kind === 'notSet' || item.kind === 'error' ? 'other' : 'member';
};

const splitItem = (item: ClassBodyItemJson) => {
    if (item.kind === 'initializer') {
        const { kind, ...value } = item;
        return { kind, value };
    }
    return { kind: item.kind, sourceKeys: item.sourceKeys, value: toBody(item) };
};

/**
 * クラス本文。名前のあるメンバーは D (キー: getMemberKey)、初期化ブロックは C、ErrorJson / notSet は B で比べ、
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
        before: pick<NotSetBlockJson | ErrorJson>(before, otherIndex.before),
        after: pick<NotSetBlockJson | ErrorJson>(after, otherIndex.after),
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
            return { ...splitItem(before[p.before]!), status: 'removed', index: p.before };
        }
        if (p.status === 'added') {
            return { ...splitItem(after[p.after]!), status: 'added', index: p.after };
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
            const other = b as NotSetBlockJson | ErrorJson;
            return {
                kind: other.kind,
                status: 'unchanged',
                sourceKeys: { before: other.sourceKeys, after: (a as typeof other).sourceKeys },
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

// ClassBodyDiff が ClassDiff を含むので、循環を interface で切る
export interface ClassFields {
    name: ValueDiff<string | ErrorJson>;
    extend: OptionalDiff<TypeJson | ErrorJson, TypeDiff>;
    implement: ListOrErrorDiff<TypesDiff, TypeJson | ErrorJson>;
    block: ClassBodyDiff[];
}

export type ClassDiff = NodeDiff<'class', ClassDeclarationJson, ClassFields>;

export const makeClassDiff = (
    before: ClassDeclarationJson | ErrorJson,
    after: ClassDeclarationJson | ErrorJson,
    match: Match = 'slot',
    sources?: Sources,
    identity?: Identity<ClassDeclarationJson | ErrorJson>,
): ClassDiff => {
    return makeNodeDiff(
        'class',
        before,
        after,
        match,
        (b, a): ClassFields => ({
            name: makeValueDiff(b.name, a.name),
            extend: makeOptionalDiff(b.extend, a.extend, (be, ae) => makeTypeDiff(be, ae)),
            implement: makeListOrErrorDiff(b.implement, a.implement, (bi, ai) =>
                makeTypesDiff(bi, ai, sources),
            ),
            block: makeClassBodyDiff(b.block, a.block, sources),
        }),
        identity,
    );
};
