import {
    AnonymousUnitJson,
    CompilationUnitJson,
    StatementJson,
    TriggerCaseJson,
    TriggerUnitJson,
    ApexClassMetaJson,
    ApexTriggerMetaJson,
} from '../../../types';

import {
    Body,
    ListItemDiff,
    Match,
    NodeDiff,
    SourceKeysDiff,
    Sources,
    ValueDiff,
    makeNodeDiff,
    makeSetDiff,
    makeSourceKeysDiff,
    makeValueDiff,
} from '../../commons/diff/commons';
import { ModifiersJsonDiff, makeModifierItemsDiff, makeTypedModifierJsons } from './modifier';
import {
    ClassBodyDiff,
    MemberDeclarationJsonDiff,
    ClassMemberJson,
    makeClassBodyDiff,
    makeClassMemberDiff,
} from './declaration';
import {
    ApexClassMetaJsonDiff,
    ApexTriggerMetaJsonDiff,
    makeApexClassMetaDiff,
    makeApexTriggerMetaDiff,
} from './meta';
import { BlockDiff, makeBlockDiff } from './statement';
import { APEX_STATEMENT_KINDS } from '../walker';

// 方針: docs/apex-implementation.md、docs/apex-implementation.md 7.3

// ---------------------------------------------------------------------------
// cls: 型宣言 (class / interface / enum)
// ---------------------------------------------------------------------------

type TypeDeclarationJson = Omit<CompilationUnitJson, 'fileType'>;

/** 同じ kind ならクラスメンバーと同じ形の差分、kind が変わったら丸ごと */
export type CompilationUnitJsonDiff =
    | MemberDeclarationJsonDiff
    | {
          kind: { before: string; after: string };
          sourceKeys: SourceKeysDiff<TypeDeclarationJson['sourceKeys']>;
          status: 'changed';
          match: Match;
          before: Body<TypeDeclarationJson>;
          after: Body<TypeDeclarationJson>;
      };

export const makeTypeDeclarationDiff = (
    before: TypeDeclarationJson,
    after: TypeDeclarationJson,
    sources?: Sources,
): CompilationUnitJsonDiff => {
    if (before.kind !== after.kind) {
        const { kind: _bk, sourceKeys: _bs, ...b } = before;
        const { kind: _ak, sourceKeys: _as, ...a } = after;
        return {
            kind: { before: before.kind, after: after.kind },
            sourceKeys: makeSourceKeysDiff(before.sourceKeys, after.sourceKeys),
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

type BlockMemberJson = AnonymousUnitJson['block'][number];
type NonStatementMemberJson = Exclude<BlockMemberJson, StatementJson>;

/**
 * 宣言と文が混ざった本文。宣言はクラス本文と同じ方法 (makeClassBodyDiff)、
 * 文は GumTree で比べる (BlockDiff)。index はそれぞれのグループの中での位置。
 * 文は修飾子を持たない (段階 A5 で、文を包む入れ物と、いつも空の修飾子をなくした)
 */
export type BlockMembersDiff = {
    member: ClassBodyDiff[];
    statement: BlockDiff;
};

const isStatementMember = (member: BlockMemberJson): member is StatementJson =>
    APEX_STATEMENT_KINDS.has(member.kind);

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
        statement: makeBlockDiff(
            before.filter(isStatementMember),
            after.filter(isStatementMember),
            sources,
        ),
    };
};

export type AnonymousUnitJsonDiff = {
    fileType: 'anonymous';
    block: BlockMembersDiff;
};

export const makeAnonymousUnitDiff = (
    before: AnonymousUnitJson,
    after: AnonymousUnitJson,
    sources?: Sources,
): AnonymousUnitJsonDiff => {
    return {
        fileType: 'anonymous',
        block: makeBlockMembersDiff(before.block, after.block, sources),
    };
};

/** トリガーの対象イベント (before insert など) は B. 集合。中身の差分は、ほかのノードと同じく項目ごとに持つ */
export type TriggerCaseJsonDiff = ListItemDiff<
    'triggerCase',
    TriggerCaseJson,
    NodeDiff<
        'triggerCase',
        TriggerCaseJson,
        {
            actionType: ValueDiff<TriggerCaseJson['actionType']>;
            timing: ValueDiff<TriggerCaseJson['timing']>;
        }
    >
>;

export const makeTriggerCasesDiff = (
    before: TriggerCaseJson[],
    after: TriggerCaseJson[],
    sources?: Sources,
): TriggerCaseJsonDiff[] => {
    return makeSetDiff(
        'triggerCase',
        before,
        after,
        (b, a, match) =>
            makeNodeDiff('triggerCase', b, a, match, (bb, aa) => ({
                actionType: makeValueDiff(bb.actionType, aa.actionType),
                timing: makeValueDiff(bb.timing, aa.timing),
            })),
        sources,
    );
};

export type TriggerUnitJsonDiff = {
    fileType: 'trigger';
    name: ValueDiff<string>;
    object: ValueDiff<string>;
    case: TriggerCaseJsonDiff[];
    block: BlockMembersDiff;
};

export const makeTriggerUnitDiff = (
    before: TriggerUnitJson,
    after: TriggerUnitJson,
    sources?: Sources,
): TriggerUnitJsonDiff => {
    return {
        fileType: 'trigger',
        name: makeValueDiff(before.name, after.name),
        object: makeValueDiff(before.object, after.object),
        case: makeTriggerCasesDiff(before.case, after.case, sources),
        block: makeBlockMembersDiff(before.block, after.block, sources),
    };
};

// ---------------------------------------------------------------------------
// ファイル単位の中身
// ---------------------------------------------------------------------------

export type UnitContentDiff =
    | CompilationUnitJsonDiff
    | TriggerUnitJsonDiff
    | AnonymousUnitJsonDiff
    | ApexClassMetaJsonDiff
    | ApexTriggerMetaJsonDiff;

/**
 * ファイルの種類 (ソースの fileType・-meta.xml の kind) → 中身の JSON の型 (ソースは fileType を除いたもの)。
 * 呼び出し側の中身の型を、種類で確かめる (docs/plan.md 10 章 P2「解析の結果の base: unknown」)
 */
export type ApexContentJsonMap = {
    cls: TypeDeclarationJson;
    trigger: Omit<TriggerUnitJson, 'fileType'>;
    anonymous: Omit<AnonymousUnitJson, 'fileType'>;
    apexClassMeta: ApexClassMetaJson;
    apexTriggerMeta: ApexTriggerMetaJson;
};

/** 差分を作る中身と、その位置 */
type UnitResult<J> = { base: J; sourceObject?: Sources['before'] | undefined };

/**
 * ファイルの中身の差分。種類が同じで、どちらも読めたときだけ作る。
 * 中身はソースなら fileType を除いた CompilationUnitJson / TriggerUnitJson / AnonymousUnitJson、-meta.xml ならその JSON
 */
export const makeUnitContentDiff = <K extends keyof ApexContentJsonMap>(
    dataType: K,
    before: UnitResult<ApexContentJsonMap[K]>,
    after: UnitResult<ApexContentJsonMap[K]>,
): UnitContentDiff | undefined => {
    // dataType で中身の型を絞る (型の引数 K は switch で絞れないので、ここで種類ごとの型として取り出す)
    const pair = <T extends keyof ApexContentJsonMap>(_: T) =>
        [before.base, after.base] as unknown as [ApexContentJsonMap[T], ApexContentJsonMap[T]];
    const sources: Sources = {
        before: before.sourceObject ?? [],
        after: after.sourceObject ?? [],
    };

    switch (dataType) {
        case 'cls':
            return makeTypeDeclarationDiff(...pair('cls'), sources);
        case 'trigger': {
            const [b, a] = pair('trigger');
            return makeTriggerUnitDiff(
                { fileType: 'trigger', ...b },
                { fileType: 'trigger', ...a },
                sources,
            );
        }
        case 'anonymous': {
            const [b, a] = pair('anonymous');
            return makeAnonymousUnitDiff(
                { fileType: 'anonymous', ...b },
                { fileType: 'anonymous', ...a },
                sources,
            );
        }
        // クラス・トリガーのメタデータ (-meta.xml)
        case 'apexClassMeta':
            return makeApexClassMetaDiff(...pair('apexClassMeta'));
        case 'apexTriggerMeta':
            return makeApexTriggerMetaDiff(...pair('apexTriggerMeta'));
        default:
            return undefined;
    }
};
