import { mkdir, readFile, writeFile } from 'node:fs/promises';

import { ApexParser, ApexParserFactory, ApexParserRuleContext } from '@apexdevtools/apex-parser';
import {
    CommonTypeClass,
    ErrorTypeClass,
    isAnonymousUnitType,
    isCompilationUnitType,
    isTriggerUnitType,
} from '../../../src/analyzer/types/apex_IR';
import {
    anonymousUnitConvert,
    compilationUnitConvert,
    triggerUnitConvert,
} from '../../../src/analyzer/types/apex/converter/unit';
import {
    makeCompilationUnitType,
    makeAnonymousUnitType,
    makeTriggerUnitType,
} from '../../../src/analyzer/types/apex';
import { CommonClass } from '../../../src/analyzer/types/apex/converter/commons';
import { UnitVisitor } from '../../../src/analyzer/types/apex_IR/unitVisitor';

import { ApexErrorListener } from '@apexdevtools/apex-parser';

type ApexSyntaxDiagnostic = {
    line: number;
    column: number;
    message: string;
};

/**
 * apex-parser はエラー回復で解析を続けるため、トークンの読み飛ばし・補完が起きても
 * 構文木だけでは気付きにくい。Lexer と Parser の両方に付けて構文エラーを収集する。
 */
class ApexSyntaxErrorCollector extends ApexErrorListener {
    readonly diagnostics: ApexSyntaxDiagnostic[] = [];

    apexSyntaxError(line: number, column: number, message: string): void {
        this.diagnostics.push({ line, column, message });
    }
}

const targets: [string, (parser: ApexParser) => ApexParserRuleContext][] = [
    ['ParserTest.cls', (parser) => parser.compilationUnit()],
    ['ParserTrigger.trigger', (parser) => parser.triggerUnit()],
    ['parser.apex', (parser) => parser.anonymousUnit()],
];

const convertUnit = (target: CommonTypeClass, errors: ErrorTypeClass[]): unknown => {
    if (isCompilationUnitType(target)) {
        const convert = compilationUnitConvert(target, errors);
        return makeCompilationUnitType(convert);
    }
    if (isTriggerUnitType(target)) {
        const convert = triggerUnitConvert(target, errors);
        return makeTriggerUnitType(convert);
    }
    if (isAnonymousUnitType(target)) {
        const convert = anonymousUnitConvert(target, errors);
        return makeAnonymousUnitType(convert);
    }

    throw new Error(`Unsupported unit type: ${target.getType()}`);
};

const errorToJson = (error: ErrorTypeClass) => ({
    type: error.getType(),
    code: error.getCode(),
    contextType: error.getContextType(),
    context: error.getContext(),
    message: error.getParseErrorMessage(),
    span: error.getSpan(),
});

const outputDirectory = new URL('./json-output/', import.meta.url);
await mkdir(outputDirectory, { recursive: true });

for (const [file, rule] of targets) {
    const source = await readFile(new URL(`./${file}`, import.meta.url), 'utf8');
    const syntaxErrors = new ApexSyntaxErrorCollector();
    const { parser } = ApexParserFactory.createLexerAndParser(source, syntaxErrors);
    const unit = new UnitVisitor().visit(rule(parser));
    const conversionErrors: ErrorTypeClass[] = [];
    const converted = convertUnit(unit, conversionErrors);

    const result = {
        file,
        syntaxErrors: syntaxErrors.diagnostics.map(({ line, column, message }) => ({
            line,
            column,
            message,
        })),
        conversionErrors: conversionErrors.map(errorToJson),
        converted,
    };

    const outputFile = new URL(`${file.replace(/\.[^.]+$/, '')}.json.json`, outputDirectory);
    await writeFile(outputFile, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
    console.log(`Converter output written to ${outputFile.pathname}`);
}

