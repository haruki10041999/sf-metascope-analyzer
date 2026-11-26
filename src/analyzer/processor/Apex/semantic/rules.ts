import type { ConvertKeys } from '../../../types';
import type { ApexSemanticAnalysis } from './analyze';
import { hasApexAnnotation, isApexAnnotationArgTrue } from './declaration';
import type { ApexUnitFacts } from './facts';
import { apexMemberNamesOf } from './members';

// Apex の単位の中で決まる指摘 (アノテーション・クエリの書き方。docs/plan.md 10 章 P4 の段 1「JSON にあるが使っていない情報」)。
// 参照先があるかはグラフ (dependency/graph.ts) で見るので、ここでは単位の中だけで分かることだけ:
// - SEE_ALL_DATA: @IsTest(SeeAllData=true)。組織のデータに頼るテストは、組織によって結果が変わる
// - TEST_VISIBLE_NOT_NEEDED: public・global のメンバーの @TestVisible (テストからもともと見える)
// - FUTURE_CALLOUT_NOT_ALLOWED: @future (callout=true なし) のメソッドの中の HTTP の呼び出し (実行時のエラー)
// - QUERY_SECURITY_ENFORCED: WITH SECURITY_ENFORCED のクエリ (WITH USER_MODE が推奨)

export type ApexRuleFinding = {
    code:
        | 'SEE_ALL_DATA'
        | 'TEST_VISIBLE_NOT_NEEDED'
        | 'FUTURE_CALLOUT_NOT_ALLOWED'
        | 'QUERY_SECURITY_ENFORCED';
    severity: 'warning' | 'info';
    /** 対象 (クラス・メソッドの名前 Class.method) */
    target: string;
    message: string;
    sourceKeys?: ConvertKeys;
};

export const apexRuleFindingsOf = (
    analysis: ApexSemanticAnalysis,
    facts: ApexUnitFacts,
): ApexRuleFinding[] => {
    const names = apexMemberNamesOf(analysis.declarations, analysis.repository?.index);
    const findings: ApexRuleFinding[] = [];
    /** @future (callout=true なし) のメソッドの member */
    const futureWithoutCallout = new Set<string>();

    for (const declaration of analysis.declarations) {
        if (!('modifiers' in declaration)) continue;
        const modifiers = declaration.modifiers;
        const target = names.qualifiedOf(declaration);
        if (isApexAnnotationArgTrue(modifiers, 'IsTest', 'SeeAllData')) {
            findings.push({
                code: 'SEE_ALL_DATA',
                severity: 'warning',
                target,
                message: `${target} uses @IsTest(SeeAllData=true); the test depends on the data of the org`,
                sourceKeys: declaration.sourceKeys,
            });
        }
        if (
            hasApexAnnotation(modifiers, 'TestVisible') &&
            (modifiers.access === 'public' || modifiers.access === 'global')
        ) {
            findings.push({
                code: 'TEST_VISIBLE_NOT_NEEDED',
                severity: 'info',
                target,
                message: `${target} is ${modifiers.access}; @TestVisible is not needed`,
                sourceKeys: declaration.sourceKeys,
            });
        }
        if (
            declaration.kind === 'method' &&
            hasApexAnnotation(modifiers, 'future') &&
            !isApexAnnotationArgTrue(modifiers, 'future', 'callout')
        ) {
            const member = names.memberOf(declaration);
            if (member) futureWithoutCallout.add(member);
        }
    }

    for (const call of facts.calls) {
        const member = call.context.member;
        if (call.callType !== 'callout' || !member || !futureWithoutCallout.has(member)) continue;
        findings.push({
            code: 'FUTURE_CALLOUT_NOT_ALLOWED',
            severity: 'warning',
            target: member,
            message: `${member} makes a callout but its @future has no callout=true`,
            sourceKeys: call.sourceKeys,
        });
    }

    for (const query of facts.queries) {
        if (query.accessMode !== 'SECURITY_ENFORCED') continue;
        const target = query.context.member ?? '';
        findings.push({
            code: 'QUERY_SECURITY_ENFORCED',
            severity: 'info',
            target,
            message: `${target || 'The unit'} uses WITH SECURITY_ENFORCED; WITH USER_MODE is recommended`,
            sourceKeys: query.sourceKeys,
        });
    }
    return findings;
};
