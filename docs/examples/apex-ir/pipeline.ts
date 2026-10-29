/**
 * docs/examples の生成スクリプトで共通に使う変換処理。
 *
 * ソース → IR（UnitVisitor）→ CommonType（converter）
 *   → ConvertNode + SourceJson[]（makeConvertType）→ JSON（make*UnitJson）
 *   → JSON に残った objectKey / sourceKey だけの SourceJson[]（regenerateSourceObjects）
 */
import { ApexParser, ApexParserFactory, ApexParserRuleContext } from '@apexdevtools/apex-parser';

import { CommonErrorListener, ErrorTypeClass } from '../../../src/analyzer/types/apex_IR/commonVisitor';
import { UnitVisitor } from '../../../src/analyzer/types/apex_IR/unitVisitor';
import {
    JsonType,
    assignMultiClass,
    makeAnonymousUnitAssignRule,
    makeAnonymousUnitJson,
    makeCompilationUnitAssignRule,
    makeCompilationUnitJson,
    makeConvertType,
    makeErrorAssignRule,
    makeTriggerUnitAssignRule,
    makeTriggerUnitJson,
    regenerateSourceObjects,
} from '../../../src/analyzer/types/apex';

export type UnitRule = (parser: ApexParser) => ApexParserRuleContext;

export const unitRules = {
    cls: (parser: ApexParser) => parser.compilationUnit(),
    trigger: (parser: ApexParser) => parser.triggerUnit(),
    anonymous: (parser: ApexParser) => parser.anonymousUnit(),
} satisfies Record<string, UnitRule>;

// docs/examples/apex-ir のサンプル
export const samples: { file: string; rule: UnitRule }[] = [
    { file: 'ParserTest.cls', rule: unitRules.cls },
    { file: 'ParserTrigger.trigger', rule: unitRules.trigger },
    { file: 'parser.apex', rule: unitRules.anonymous },
];

export const sampleUrl = (file: string) => new URL(`./${file}`, import.meta.url);

export const baseName = (file: string) => file.replace(/\.[^.]+$/, '');

/** 構文エラーを CommonErrorListener で集めながら IR を作る */
export const parseUnit = (source: string, rule: UnitRule) => {
    const errorListener = new CommonErrorListener(source);
    const { parser } = ApexParserFactory.createLexerAndParser(source, errorListener);
    const unit = new UnitVisitor().visit(rule(parser));
    return { unit, syntaxErrors: errorListener.getErrors() };
};

export const toSyntaxErrorJson = (errors: ErrorTypeClass[]) =>
    errors.map((error) => {
        const span = error.getSpan();
        return {
            line: span?.start.line ?? null,
            column: span?.start.column ?? null,
            context: error.getContext(),
            message: error.getParseErrorMessage(),
        };
    });

/** IR → CommonType */
export const toCommonType = (unit: unknown) =>
    assignMultiClass(unit, [
        makeCompilationUnitAssignRule,
        makeTriggerUnitAssignRule,
        makeAnonymousUnitAssignRule,
        makeErrorAssignRule,
    ]);

/** CommonType → JSON と、JSON に残ったキーだけの SourceJson[] */
export const toJsonOutput = async (commonType: { type: string }) => {
    const { result, sourceObjects } = await makeConvertType(commonType as never);
    const converted = result as { type: string };
    const json =
        converted.type === 'compilationUnit'
            ? makeCompilationUnitJson(converted as never)
            : converted.type === 'triggerUnit'
              ? makeTriggerUnitJson(converted as never)
              : makeAnonymousUnitJson(converted as never);

    return {
        convertNode: result,
        allSourceObjects: sourceObjects,
        json,
        sourceObjects: regenerateSourceObjects(sourceObjects, json as JsonType<string>),
    };
};
