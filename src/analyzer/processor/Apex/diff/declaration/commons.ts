import {
    ClassDeclarationJson,
    ErrorJson,
    InitializerBlockJson,
    ModifiersJson,
    NotSetBlockJson,
    ParameterJson,
    StatementJson,
} from '../../../../types';

import { JsonNode, Match, Sources, getObjectKey, pairAsSequence } from '../commons';
import { SourceDistance, findSourceInfo, getSourceDistance } from '../../commons';
import { GumTreeDiff, makeGumTreeDiff } from '../gumtree/diff';
import { matchTrees } from '../gumtree/matcher';
import { GumTreeNode, makeBlockTree } from '../gumtree/tree';
import { makeTypedModifierJsons } from '../modifier';
import { getTypeKey } from '../type';

// 方針: docs/apex-declaration-diff.md

// ---------------------------------------------------------------------------
// 識別キー
// ---------------------------------------------------------------------------

/** パラメータ型の並び。パラメータリストがエラーならキーを持たない */
export const getParamTypesKey = (
    param: (ParameterJson | ErrorJson)[] | ErrorJson | undefined,
): string | undefined => {
    const list = param ?? [];
    if (!Array.isArray(list)) {
        return undefined;
    }

    return list.map((p) => (p.kind === 'error' ? 'error' : getTypeKey(p.variantType))).join(',');
};

/** メソッドの識別キー `名前(型,型,...)`。オーバーロードを区別するため、パラメータ名は含めない */
export const getSignatureKey = (
    name: string | ErrorJson,
    param: (ParameterJson | ErrorJson)[] | ErrorJson | undefined,
): string | undefined => {
    const paramTypes = getParamTypesKey(param);
    if (typeof name !== 'string' || paramTypes === undefined) {
        return undefined;
    }

    return `${name}(${paramTypes})`;
};

export type ClassBodyItemJson = ClassDeclarationJson['block'][number];

/** クラス本文のうち、名前で対応付けるメンバー */
export type ClassMemberJson = Exclude<
    ClassBodyItemJson,
    InitializerBlockJson | NotSetBlockJson | ErrorJson
>;

/** クラスメンバーの識別キー。kind を先頭に付けるので、対応付いた組は必ず同じ kind になる */
export const getMemberKey = (member: ClassMemberJson): string | undefined => {
    const withKind = (key: string | undefined) =>
        key === undefined ? undefined : `${member.kind}:${key}`;

    switch (member.kind) {
        case 'method':
            return withKind(getSignatureKey(member.name, member.param));
        case 'constructor': {
            // 名前はクラス名と同じはずなのでキーに入れない
            const paramTypes = getParamTypesKey(member.param);
            return withKind(paramTypes === undefined ? undefined : `(${paramTypes})`);
        }
        case 'field': {
            const variants = member.variants;
            if (!Array.isArray(variants)) {
                return undefined;
            }
            const names = variants.map((v) =>
                'name' in v && typeof v.name === 'string' ? v.name : undefined,
            );
            return names.every((n) => n !== undefined) ? withKind(names.join(',')) : undefined;
        }
        default:
            return typeof member.name === 'string' ? withKind(member.name) : undefined;
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

// ---------------------------------------------------------------------------
// 文の並び (暫定)
// ---------------------------------------------------------------------------

export type Statement = StatementJson | ErrorJson;

/** 文の比較用キー。入れ子のブロック (配列) は kind / sourceKeys を持たないので、子のキーの並びから作る */
export const getStatementKey = (statement: Statement): string => {
    return Array.isArray(statement)
        ? `{${statement.map(getStatementKey).join(',')}}`
        : getObjectKey(statement);
};

const getStatementKind = (statement: Statement): string => {
    return Array.isArray(statement) ? 'block' : statement.kind;
};

export type StatementDiff =
    | {
          status: 'unchanged' | 'moved';
          match: Match;
          index: { before: number; after: number };
          value: Statement;
      }
    | {
          status: 'changed';
          match: Match;
          index: { before: number; after: number };
          before: Statement;
          after: Statement;
      }
    | { status: 'added' | 'removed'; index: number; value: Statement };

/** 文の並びの差分 (GumTree)。根の block の子 (= 文) ごとの差分 */
export type BlockDiff = GumTreeDiff[];

export type BlockDiffer = (before: Statement[], after: Statement[], sources?: Sources) => BlockDiff;

/**
 * GumTree を使わない簡易版。C. 順序付き列で文を対応付け、changed の組は中に入らずに before / after を丸ごと持つ。
 * GumTree の結果と見比べるために残している。
 */
export const makeOpaqueBlockDiff = (before: Statement[], after: Statement[]): StatementDiff[] => {
    const pairings = pairAsSequence(before.map(getStatementKey), after.map(getStatementKey), {
        canPair: (b, a) => getStatementKind(before[b]!) === getStatementKind(after[a]!),
    });

    return pairings.map((p): StatementDiff => {
        if (p.status === 'removed') {
            return { status: 'removed', index: p.before, value: before[p.before]! };
        }
        if (p.status === 'added') {
            return { status: 'added', index: p.after, value: after[p.after]! };
        }

        const index = { before: p.before, after: p.after };
        if (p.status === 'changed') {
            return {
                status: 'changed',
                match: p.match,
                index,
                before: before[p.before]!,
                after: after[p.after]!,
            };
        }
        return { status: p.status, match: p.match, index, value: before[p.before]! };
    });
};

/** ソース位置の距離。sources がない、または位置が引けないノードは undefined */
const makeNodeDistance = (sources: Sources) => {
    return (before: GumTreeNode, after: GumTreeNode): SourceDistance | undefined => {
        if (!before.source || !after.source) {
            return undefined;
        }
        try {
            return getSourceDistance(
                findSourceInfo(sources.before, before.source),
                findSourceInfo(sources.after, after.source),
            );
        } catch {
            return undefined;
        }
    };
};

/**
 * 文の並びの差分を GumTree で取る (docs/apex-gumtree-diff.md)。
 * 要素は文に限らない (匿名 Apex / トリガーの本文の `kind: 'statement'` の要素も渡せる)
 */
export const makeGumTreeBlockDiff = (
    before: unknown[],
    after: unknown[],
    sources?: Sources,
): BlockDiff => {
    const root1 = makeBlockTree(before);
    const root2 = makeBlockTree(after);
    const mappings = matchTrees(
        root1,
        root2,
        sources ? { distance: makeNodeDistance(sources) } : {},
    );
    return makeGumTreeDiff(root1, root2, mappings);
};

/** 宣言の Diff が使う文の並びの差分 */
export const makeBlockDiff: BlockDiffer = makeGumTreeBlockDiff;
