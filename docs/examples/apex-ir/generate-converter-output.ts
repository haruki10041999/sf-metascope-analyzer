import { createHash } from 'node:crypto';
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
import {
    assignMultiClass,
    ErrorInfo,
    SourceNode,
    SourceSlot,
} from '../../../src/analyzer/types/apex/converter/commons';
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
    let sourceTree: SourceNode | null = null;
    const slot: SourceSlot = (node) => {
        sourceTree = node;
    };
    const converted = assignMultiClass(unit, [
        makeCompilationUnitRule(slot, conversionErrors),
        makeTriggerUnitRule(slot, conversionErrors),
        makeAnonymousUnitRule(slot, conversionErrors),
    ]);
    if (converted === null || sourceTree === null) {
        throw new Error(`Unsupported unit type in ${file}: ${unit.getType()}`);
    }

    const sourceHash = createHash('sha256').update(source).digest('hex');
    const baseName = file.replace(/\.[^.]+$/, '');
    const convertedResult = {
        file,
        sourceHash,
        sourceFile: `../source-output/${baseName}.source.json`,
        syntaxErrorCount: syntaxErrors.diagnostics.length,
        conversionErrors: conversionErrors.map(({ errorCode }, index) => ({
            errorCode,
            index: index + 1,
        })),
        converted,
    };
    const sourceResult = {
        file,
        sourceHash,
        sourceText: source,
        syntaxErrors: syntaxErrors.diagnostics,
        conversionErrors: conversionErrors.map((error, index) => ({
            ...error,
            index: index + 1,
        })),
        source: sourceTree,
    };
    return { convertedResult, sourceResult };
};

export const generateConverterOutputs = async (baseDirectory = new URL('./', import.meta.url)) => {
    const outputDirectory = new URL('./converter-output/', baseDirectory);
    const sourceDirectory = new URL('./source-output/', baseDirectory);
    await Promise.all([
        mkdir(outputDirectory, { recursive: true }),
        mkdir(sourceDirectory, { recursive: true }),
    ]);

    for (const [file, rule] of targets) {
        const source = await readFile(new URL(`./${file}`, import.meta.url), 'utf8');
        const { convertedResult, sourceResult } = parseConverterSample(file, source, rule);
        const baseName = file.replace(/\.[^.]+$/, '');
        const outputFile = new URL(`${baseName}.converted.json`, outputDirectory);
        const sourceFile = new URL(`${baseName}.source.json`, sourceDirectory);
        await writeFile(sourceFile, `${JSON.stringify(sourceResult, null, 2)}\n`, 'utf8');
        await writeFile(outputFile, `${JSON.stringify(convertedResult, null, 2)}\n`, 'utf8');
        console.log(`Converter output written to ${fileURLToPath(outputFile)}`);
        console.log(`Source information written to ${fileURLToPath(sourceFile)}`);
    }
};

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    await generateConverterOutputs();
}
