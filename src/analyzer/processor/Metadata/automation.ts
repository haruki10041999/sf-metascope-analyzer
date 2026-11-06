import type { ApexUnitParseResult } from '../../parser/Apex/unit';
import type { FlowParseResult } from '../../parser/Metadata/flow';
import type { ObjectParseResult } from '../../parser/Metadata/parser';
import type { ConvertKeys, ValidationRuleJson } from '../../types';
import { analyzeFlows, type ObjectAutomation } from './flowAnalysis';
import { getApexTriggers, type ApexTriggerInfo } from './references';

// オブジェクトごとの自動化 (レコードトリガーフロー・Apex トリガー・入力規則)。方針: docs/metadata-implementation.md 10 章
// レコードを保存したときに動くものを、オブジェクトごとに一覧にする (レポートの TriggerOrderTable のもと)

export type ValidationRuleInfo = {
    name: string;
    active: boolean;
    errorMessage?: string;
    sourceKeys: ConvertKeys;
};

export type ObjectAutomationSummary = {
    object: string;
    /** レコードトリガーフロー (triggerOrder の順) */
    flows: ObjectAutomation['flows'];
    /** Apex トリガー (名前の順) */
    triggers: Omit<ApexTriggerInfo, 'object'>[];
    /** 入力規則 (名前の順) */
    validationRules: ValidationRuleInfo[];
};

export type AutomationInputs = {
    flows?: FlowParseResult[];
    apex?: ApexUnitParseResult[];
    objects?: ObjectParseResult[];
};

/** オブジェクトごとの自動化。どれかがあるオブジェクトだけを、API 名の順に並べる */
export const analyzeAutomation = (inputs: AutomationInputs): ObjectAutomationSummary[] => {
    const summaries = new Map<string, ObjectAutomationSummary>();
    const summaryOf = (object: string) => {
        const key = object.toLowerCase();
        const current = summaries.get(key);
        if (current) return current;
        const created: ObjectAutomationSummary = {
            object,
            flows: [],
            triggers: [],
            validationRules: [],
        };
        summaries.set(key, created);
        return created;
    };

    analyzeFlows(inputs.flows ?? []).automation.forEach(({ object, flows }) =>
        summaryOf(object).flows.push(...flows),
    );
    getApexTriggers(inputs.apex ?? [])
        .sort((a, b) => a.name.localeCompare(b.name))
        .forEach(({ object, ...trigger }) => summaryOf(object).triggers.push(trigger));
    for (const result of inputs.objects ?? []) {
        if (result.dataType !== 'object') continue;
        const rules = (result.result.base.validationRules ?? []).filter(
            (rule): rule is ValidationRuleJson => rule.kind === 'validationRule',
        );
        if (!rules.length) continue;
        summaryOf(result.result.base.apiName).validationRules.push(
            ...rules
                .map((rule) => ({
                    name: rule.fullName,
                    active: rule.active === true,
                    ...(rule.errorMessage !== undefined ? { errorMessage: rule.errorMessage } : {}),
                    sourceKeys: rule.sourceKeys,
                }))
                .sort((a, b) => a.name.localeCompare(b.name)),
        );
    }

    return [...summaries.values()].sort((a, b) => a.object.localeCompare(b.object));
};
