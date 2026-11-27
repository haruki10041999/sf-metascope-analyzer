import type { ConvertKeys } from '../../../types';
import type { ApexSemanticAnalysis } from './analyze';
import type { ApexModifierInfo } from './declaration';
import type { ApexUnitFacts } from './facts';
import { apexMemberNamesOf } from './members';

// ★CRUD/FLS・共有の検査 (docs/plan.md 10 章 P4 段 2・docs/plan-details.md C-7)。
// SOQL・SOSL・動的なクエリ・DML ごとに、権限 (オブジェクト・項目のアクセス権) をどう守っているかと、
// それを含むクラスの共有の宣言を出す。
// - クエリ: WITH USER_MODE → userMode、WITH SECURITY_ENFORCED → securityEnforced、WITH SYSTEM_MODE → systemMode
// - DML: AccessLevel.USER_MODE・as user → userMode、AccessLevel.SYSTEM_MODE・as system → systemMode
// - どちらも書いていなくても、同じメンバーで Security.stripInaccessible を呼んでいれば stripInaccessible
// - それ以外は none (動的なクエリは、文字列の中の WITH を見ないので none か stripInaccessible)
// 共有の宣言は、操作を含むいちばん内側のクラスの with / without / inherited sharing (書いていなければ null)。
// 指摘 (findings) にするかは、docs/plan.md 9 章の「apex.findings のルールの選別」を決めてから (D)

export type ApexAccessEnforcement =
    'userMode' | 'securityEnforced' | 'systemMode' | 'stripInaccessible' | 'none';

export type ApexSecurityCheck = {
    member?: string;
    kind: 'query' | 'dml';
    /** クエリの言語 (soql・sosl・dynamic) か、DML の操作 (insert など) */
    detail: string;
    sourceKeys: ConvertKeys;
    enforcement: ApexAccessEnforcement;
    /** 操作を含むいちばん内側のクラスの共有の宣言 */
    sharing: ApexModifierInfo['sharing'];
    /** そのクラス */
    owner?: string;
    isTest: boolean;
};

const QUERY_ENFORCEMENT: Readonly<Record<string, ApexAccessEnforcement>> = {
    USER_MODE: 'userMode',
    SECURITY_ENFORCED: 'securityEnforced',
    SYSTEM_MODE: 'systemMode',
};

const DML_ENFORCEMENT: Readonly<Record<string, ApexAccessEnforcement>> = {
    USER_MODE: 'userMode',
    USER: 'userMode',
    SYSTEM_MODE: 'systemMode',
    SYSTEM: 'systemMode',
};

export const apexSecurityChecksOf = (
    analysis: ApexSemanticAnalysis,
    facts: ApexUnitFacts,
): ApexSecurityCheck[] => {
    const names = apexMemberNamesOf(analysis.declarations, analysis.repository?.index);
    // Security.stripInaccessible を呼んでいるメンバー
    const stripping = new Set(
        facts.calls
            .filter(
                (call) =>
                    call.method.toLowerCase() === 'stripinaccessible' &&
                    call.owner?.toLowerCase() === 'security',
            )
            .flatMap((call) => (call.context.member ? [call.context.member] : [])),
    );
    // 本体の ID → いちばん内側のクラス
    const ownerOf = (bodyId: string) => {
        const type = names.ownerTypeOf(names.byId.get(bodyId));
        return type?.kind === 'class' ? type : undefined;
    };
    const check = (
        base: Pick<ApexSecurityCheck, 'kind' | 'detail' | 'sourceKeys'>,
        context: ApexUnitFacts['queries'][number]['context'],
        written: ApexAccessEnforcement | undefined,
    ): ApexSecurityCheck => {
        const owner = ownerOf(context.bodyId);
        return {
            ...base,
            ...(context.member ? { member: context.member } : {}),
            enforcement:
                written ??
                (context.member && stripping.has(context.member) ? 'stripInaccessible' : 'none'),
            sharing: owner?.modifiers.sharing ?? null,
            ...(owner ? { owner: names.qualifiedOf(owner) } : {}),
            isTest: context.isTest,
        };
    };
    return [
        ...facts.queries.map((query) =>
            check(
                { kind: 'query', detail: query.language, sourceKeys: query.sourceKeys },
                query.context,
                query.accessMode ? QUERY_ENFORCEMENT[query.accessMode] : undefined,
            ),
        ),
        ...facts.dml.map((dml) =>
            check(
                { kind: 'dml', detail: dml.operation, sourceKeys: dml.sourceKeys },
                dml.context,
                dml.accessLevel ? DML_ENFORCEMENT[dml.accessLevel.toUpperCase()] : undefined,
            ),
        ),
    ];
};
