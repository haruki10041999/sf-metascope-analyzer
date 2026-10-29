import type { ApexParser, ApexParserRuleContext } from '@apexdevtools/apex-parser';

import { parse } from '../apex_IR/helpers';
import { UnitVisitor } from '../../src/analyzer/types/apex_IR/unitVisitor';
import {
    assignMultiClass,
    makeAnonymousUnitAssignRule,
    makeCompilationUnitAssignRule,
    makeErrorAssignRule,
    makeTriggerUnitAssignRule,
} from '../../src/analyzer/types/apex/converter';
import {
    JsonType,
    makeConvertType,
    regenerateSourceObjects,
} from '../../src/analyzer/types/apex/commons';
import {
    makeAnonymousUnitJson,
    makeCompilationUnitJson,
    makeTriggerUnitJson,
} from '../../src/analyzer/types/apex/unit';

export const unitRules = {
    cls: (parser: ApexParser) => parser.compilationUnit(),
    trigger: (parser: ApexParser) => parser.triggerUnit(),
    anonymous: (parser: ApexParser) => parser.anonymousUnit(),
};

export const toCommonType = (source: string, rule: (parser: ApexParser) => ApexParserRuleContext) => {
    const unit = new UnitVisitor().visit(parse(source, rule));
    return assignMultiClass(unit, [
        makeCompilationUnitAssignRule,
        makeTriggerUnitAssignRule,
        makeAnonymousUnitAssignRule,
        makeErrorAssignRule,
    ]);
};

/**
 * 本番と同じ流れで変換する。
 * CommonType → ConvertNode + SourceJson[] → JSON → JSON に残ったキーだけの SourceJson[]
 */
export const toJson = async (source: string, rule: (parser: ApexParser) => ApexParserRuleContext) => {
    const commonType = toCommonType(source, rule);
    const { result, sourceObjects } = await makeConvertType(commonType);
    const converted = result as { type: string };
    const json =
        converted.type === 'compilationUnit'
            ? makeCompilationUnitJson(converted as never)
            : converted.type === 'triggerUnit'
              ? makeTriggerUnitJson(converted as never)
              : makeAnonymousUnitJson(converted as never);
    const source_ = regenerateSourceObjects(sourceObjects, json as JsonType<string>);
    return { commonType, json: json as any, sourceObjects: source_, allSourceObjects: sourceObjects };
};

export const find = (node: any, predicate: (n: any) => boolean): any[] => {
    if (node === null || typeof node !== 'object') return [];
    const self = !Array.isArray(node) && predicate(node) ? [node] : [];
    return [...self, ...Object.values(node).flatMap((v) => find(v, predicate))];
};

export const sourceInfo = (offset: number) => ({
    context: 'test.apex',
    start: { offset, line: 1, column: offset },
    end: { offset: offset + 1, line: 1, column: offset + 1 },
});
