import { mkdir, readFile, writeFile } from 'node:fs/promises';

import { ApexParser, ApexParserFactory, ApexParserRuleContext } from '@apexdevtools/apex-parser';
import { ApexSyntaxErrorCollector } from '../../../src/analyzer/parser/apexSyntaxError';
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
import { UnitVisitor } from '../../../src/analyzer/types/apex_IR/unitVisitor';

const targets: [string, (parser: ApexParser) => ApexParserRuleContext][] = [
    ['ParserTest.cls', (parser) => parser.compilationUnit()],
    ['ParserTrigger.trigger', (parser) => parser.triggerUnit()],
    ['parser.apex', (parser) => parser.anonymousUnit()],
];

const convertUnit = (target: CommonTypeClass, errors: ErrorTypeClass[]): unknown => {
    if (isCompilationUnitType(target)) {
        return compilationUnitConvert(target, errors);
    }
    if (isTriggerUnitType(target)) {
        return triggerUnitConvert(target, errors);
    }
    if (isAnonymousUnitType(target)) {
        return anonymousUnitConvert(target, errors);
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

const outputDirectory = new URL('./converter-output/', import.meta.url);
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

    const outputFile = new URL(`${file.replace(/\.[^.]+$/, '')}.converted.json`, outputDirectory);
    await writeFile(outputFile, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
    console.log(`Converter output written to ${outputFile.pathname}`);
}
