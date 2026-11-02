import {
    AnonymousUnitJson,
    CompilationUnitJson,
    ErrorJson,
    MemberStatementJson,
    TriggerCaseJson,
    TriggerUnitJson,
} from '../../../types';

import {
    Body,
    ListItemDiff,
    Match,
    NodeDiff,
    Sources,
    ValueDiff,
    makeNodeDiff,
    makeSetDiff,
    makeValueDiff,
} from './commons';
import {
    ClassBodyDiff,
    ClassMemberDiff,
    makeClassBodyDiff,
    makeClassMemberDiff,
} from './declaration/class';
import { BlockDiff, ClassMemberJson, makeGumTreeBlockDiff } from './declaration/commons';

// 方針: docs/apex-declaration-diff.md 6 章、docs/apex-gumtree-diff.md 7.3

// ---------------------------------------------------------------------------
// cls: 型宣言 (class / interface / enum)
// ---------------------------------------------------------------------------

type TypeDeclarationJson = Omit<CompilationUnitJson, 'fileType'>;

/** 同じ kind ならクラスメンバーと同じ形の差分、kind が変わったら丸ごと */
export type TypeDeclarationDiff =
    | ClassMemberDiff
    | {
          kind: { before: string; after: string };
          sourceKeys: {
              before: TypeDeclarationJson['sourceKeys'];
              after: TypeDeclarationJson['sourceKeys'];
          };
          status: 'changed';
          match: Match;
          before: Body<TypeDeclarationJson>;
          after: Body<TypeDeclarationJson>;
      };

export const makeTypeDeclarationDiff = (
    before: TypeDeclarationJson,
    after: TypeDeclarationJson,
    sources?: Sources,
): TypeDeclarationDiff => {
    if (before.kind !== after.kind) {
        const { kind: _bk, sourceKeys: _bs, ...b } = before;
        const { kind: _ak, sourceKeys: _as, ...a } = after;
        return {
            kind: { before: before.kind, after: after.kind },
            sourceKeys: { before: before.sourceKeys, after: after.sourceKeys },
            status: 'changed',
            match: 'slot',
            before: b as Body<TypeDeclarationJson>,
            after: a as Body<TypeDeclarationJson>,
        };
    }
    return makeClassMemberDiff(
        before as ClassMemberJson,
        after as ClassMemberJson,
        'slot',
        sources,
    );
};

// ---------------------------------------------------------------------------
// anonymous / trigger の本文
// ---------------------------------------------------------------------------

type BlockMemberJson = Exclude<AnonymousUnitJson['block'], ErrorJson>[number];
type NonStatementMemberJson = Exclude<BlockMemberJson, MemberStatementJson>;

/**
 * 宣言と文が混ざった本文。宣言と ErrorJson はクラス本文と同じ方法 (makeClassBodyDiff)、
 * 文 (`kind: 'statement'`) は GumTree で比べる。index はそれぞれのグループの中での位置。
 */
export type BlockMembersDiff = {
    member: ClassBodyDiff[];
    statement: BlockDiff;
};

const isStatementMember = (member: BlockMemberJson): member is MemberStatementJson =>
    member.kind === 'statement';

const isNonStatementMember = (member: BlockMemberJson): member is NonStatementMemberJson =>
    !isStatementMember(member);

export const makeBlockMembersDiff = (
    before: BlockMemberJson[],
    after: BlockMemberJson[],
    sources?: Sources,
): BlockMembersDiff => {
    return {
        member: makeClassBodyDiff(
            before.filter(isNonStatementMember),
            after.filter(isNonStatementMember),
            sources,
        ),
        statement: makeGumTreeBlockDiff(
            before.filter(isStatementMember),
            after.filter(isStatementMember),
            sources,
        ),
    };
};

type BlockMembersOrErrorDiff = BlockMembersDiff | ValueDiff<BlockMemberJson[] | ErrorJson>;

const makeBlockMembersOrErrorDiff = (
    before: BlockMemberJson[] | ErrorJson,
    after: BlockMemberJson[] | ErrorJson,
    sources?: Sources,
): BlockMembersOrErrorDiff => {
    return Array.isArray(before) && Array.isArray(after)
        ? makeBlockMembersDiff(before, after, sources)
        : makeValueDiff(before, after);
};

export type AnonymousUnitDiff = {
    fileType: 'anonymous';
    block: BlockMembersOrErrorDiff;
};

export const makeAnonymousUnitDiff = (
    before: AnonymousUnitJson,
    after: AnonymousUnitJson,
    sources?: Sources,
): AnonymousUnitDiff => {
    return {
        fileType: 'anonymous',
        block: makeBlockMembersOrErrorDiff(before.block, after.block, sources),
    };
};

/** トリガーの対象イベント (before insert など) は B. 集合 */
export type TriggerCasesDiff = ListItemDiff<
    'triggerCase',
    TriggerCaseJson | ErrorJson,
    NodeDiff<'triggerCase', TriggerCaseJson, undefined>
>;

export const makeTriggerCasesDiff = (
    before: (TriggerCaseJson | ErrorJson)[],
    after: (TriggerCaseJson | ErrorJson)[],
    sources?: Sources,
): TriggerCasesDiff[] => {
    return makeSetDiff(
        'triggerCase',
        before,
        after,
        (b, a, match) => makeNodeDiff('triggerCase', b, a, match, () => undefined),
        sources,
    );
};

export type TriggerUnitDiff = {
    fileType: 'trigger';
    name: ValueDiff<string | ErrorJson>;
    object: ValueDiff<string | ErrorJson>;
    case: TriggerCasesDiff[];
    block: BlockMembersOrErrorDiff;
};

export const makeTriggerUnitDiff = (
    before: TriggerUnitJson,
    after: TriggerUnitJson,
    sources?: Sources,
): TriggerUnitDiff => {
    return {
        fileType: 'trigger',
        name: makeValueDiff(before.name, after.name),
        object: makeValueDiff(before.object, after.object),
        case: makeTriggerCasesDiff(before.case, after.case, sources),
        block: makeBlockMembersOrErrorDiff(before.block, after.block, sources),
    };
};

// ---------------------------------------------------------------------------
// ファイル単位の中身
// ---------------------------------------------------------------------------

export type UnitContentDiff = TypeDeclarationDiff | TriggerUnitDiff | AnonymousUnitDiff;

/** FileStructureType の result (base は fileType を除いた JSON) */
type UnitResult = { base: unknown; sourceObject?: Sources['before'] | undefined };

/**
 * ファイルの中身の差分。dataType が同じで、どちらもエラーでないときだけ作る。
 * base は fileType を除いた CompilationUnitJson / TriggerUnitJson / AnonymousUnitJson。
 */
export const makeUnitContentDiff = (
    dataType: string,
    before: UnitResult,
    after: UnitResult,
): UnitContentDiff | undefined => {
    const sources: Sources = {
        before: before.sourceObject ?? [],
        after: after.sourceObject ?? [],
    };

    switch (dataType) {
        case 'cls':
            return makeTypeDeclarationDiff(
                before.base as TypeDeclarationJson,
                after.base as TypeDeclarationJson,
                sources,
            );
        case 'trigger':
            return makeTriggerUnitDiff(
                { fileType: 'trigger', ...(before.base as Omit<TriggerUnitJson, 'fileType'>) },
                { fileType: 'trigger', ...(after.base as Omit<TriggerUnitJson, 'fileType'>) },
                sources,
            );
        case 'anonymous':
            return makeAnonymousUnitDiff(
                { fileType: 'anonymous', ...(before.base as Omit<AnonymousUnitJson, 'fileType'>) },
                { fileType: 'anonymous', ...(after.base as Omit<AnonymousUnitJson, 'fileType'>) },
                sources,
            );
        default:
            return undefined;
    }
};

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
