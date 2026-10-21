import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { ApexParser, ApexParserFactory, ApexParserRuleContext } from '@apexdevtools/apex-parser';
import { ApexSyntaxErrorCollector } from '../../../src/analyzer/parser/Apex/apexSyntaxError';
import {
    makeAnonymousUnitRule,
    makeCompilationUnitRule,
    makeTriggerUnitRule,
} from '../../../src/analyzer/types/apex/converter/unit';
import { assignMultiClass, ErrorInfo } from '../../../src/analyzer/types/apex/converter/commons';
import { extractSourceInfo } from '../../../src/analyzer/types/apex/commons';
import { UnitVisitor } from '../../../src/analyzer/types/apex_IR/unitVisitor';

const targets: [string, (parser: ApexParser) => ApexParserRuleContext][] = [
    ['ParserTest.cls', (parser) => parser.compilationUnit()],
    ['ParserTrigger.trigger', (parser) => parser.triggerUnit()],
    ['parser.apex', (parser) => parser.anonymousUnit()],
];

export const parseConverterSample = (
    file: string,
    source: string,
    rule: (parser: ApexParser) => ApexParserRuleContext,
) => {
    const syntaxErrors = new ApexSyntaxErrorCollector();
    const { parser } = ApexParserFactory.createLexerAndParser(source, syntaxErrors);
    const unit = new UnitVisitor().visit(rule(parser));
    const conversionErrors: ErrorInfo[] = [];
    const converted = assignMultiClass(unit, [
        makeCompilationUnitRule(conversionErrors),
        makeTriggerUnitRule(conversionErrors),
        makeAnonymousUnitRule(conversionErrors),
    ]);
    if (converted === null) {
        throw new Error(`Unsupported unit type in ${file}: ${unit.getType()}`);
    }
    const output = extractSourceInfo(converted);

    return {
        file,
        syntaxErrors: syntaxErrors.diagnostics,
        conversionErrors: conversionErrors.map((error, index) => ({ ...error, index: index + 1 })),
        converted: output,
    };
};

export const generateConverterOutputs = async (baseDirectory = new URL('./', import.meta.url)) => {
    const outputDirectory = new URL('./converter-output/', baseDirectory);
    await mkdir(outputDirectory, { recursive: true });

    for (const [file, rule] of targets) {
        const source = await readFile(new URL(`./${file}`, import.meta.url), 'utf8');
        const result = parseConverterSample(file, source, rule);
        const outputFile = new URL(
            `${file.replace(/\.[^.]+$/, '')}.converted.json`,
            outputDirectory,
        );
        await writeFile(outputFile, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
        console.log(`Converter output written to ${fileURLToPath(outputFile)}`);
    }
};

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    await generateConverterOutputs();
}
