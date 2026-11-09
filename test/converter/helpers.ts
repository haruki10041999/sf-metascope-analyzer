import {
    ApexParserFactory,
    type ApexParser,
    type ApexParserRuleContext,
} from '@apexdevtools/apex-parser';

import { ApexCommonErrorListener } from '../../src/analyzer/parser/Apex/errorListener';
import { regenerateSourceObjects } from '../../src/analyzer/types/apex/commons';
import {
    makeAnonymousUnitJson,
    makeCompilationUnitJson,
    makeTriggerUnitJson,
} from '../../src/analyzer/types/apex/unit';
import { buildApexIr } from '../../src/analyzer/types/apex_IR_v2/commonVisitor';
import {
    AnonymousUnitTypeClass,
    CompilationUnitTypeClass,
    TriggerUnitTypeClass,
} from '../../src/analyzer/types/apex_IR_v2/unitVisitor';
import {
    CommonTypeClass,
    collectSourceObjects,
    type TypeField,
} from '../../src/analyzer/types/commons/ir';

export const unitRules = {
    cls: (parser: ApexParser) => parser.compilationUnit(),
    trigger: (parser: ApexParser) => parser.triggerUnit(),
    anonymous: (parser: ApexParser) => parser.anonymousUnit(),
};

/** IR v2 の unit を作る (本番の parseApexSource と同じ。docs/ir-v2-integration.md) */
const buildUnit = (source: string, rule: (parser: ApexParser) => ApexParserRuleContext) => {
    const listener = new ApexCommonErrorListener(source);
    const { parser } = ApexParserFactory.createLexerAndParser(source, listener);
    if (rule === unitRules.trigger) {
        return buildApexIr(
            parser.triggerUnit(),
            (c) => TriggerUnitTypeClass.create(c),
            'triggerUnit',
        );
    }
    if (rule === unitRules.anonymous) {
        return buildApexIr(
            parser.anonymousUnit(),
            (c) => AnonymousUnitTypeClass.create(c),
            'anonymousUnit',
        );
    }
    return buildApexIr(
        parser.compilationUnit(),
        (c) => CompilationUnitTypeClass.create(c),
        'compilationUnit',
    );
};

/** IR のノードを、フィールドの値を見るための素のオブジェクトにする ({ type, ...フィールド }) */
export const dumpIr = (value: unknown): unknown => {
    if (value instanceof CommonTypeClass) {
        return dumpIr((value as CommonTypeClass<string, TypeField<string>>).getFields());
    }
    if (Array.isArray(value)) return value.map(dumpIr);
    if (value === null || typeof value !== 'object') return value;
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, dumpIr(child)]));
};

/**
 * 本番と同じ流れで変換する。
 * IR v2 → JSON → JSON に残ったキーだけの SourceJson[]
 */
export const toJson = async (
    source: string,
    rule: (parser: ApexParser) => ApexParserRuleContext,
) => {
    const built = buildUnit(source, rule);
    const unit = built.result;
    if (!unit) {
        throw new Error(
            `unit を作れませんでした: ${built.errors.map((e) => e.errorMessage).join(', ')}`,
        );
    }
    const json =
        unit.kind === 'compilationUnit'
            ? makeCompilationUnitJson(unit)
            : unit.kind === 'triggerUnit'
              ? makeTriggerUnitJson(unit)
              : makeAnonymousUnitJson(unit);
    const allSourceObjects = collectSourceObjects(unit);
    return {
        ir: unit,
        irErrors: built.errors,
        json: json as any,
        sourceObjects: regenerateSourceObjects(allSourceObjects, json),
        allSourceObjects,
    };
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
