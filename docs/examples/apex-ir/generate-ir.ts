import { mkdir, readFile, writeFile } from 'node:fs/promises';

import { ApexParser, ApexParserFactory, ApexParserRuleContext } from '@apexdevtools/apex-parser';
import { ApexSyntaxErrorCollector } from '../../../src/analyzer/parser/apexSyntaxError';
import { UnitVisitor } from '../../../src/analyzer/types/apex_IR/unitVisitor';

const targets: [string, (parser: ApexParser) => ApexParserRuleContext][] = [
    ['ParserTest.cls', (parser) => parser.compilationUnit()],
    ['ParserTrigger.trigger', (parser) => parser.triggerUnit()],
    ['parser.apex', (parser) => parser.anonymousUnit()],
];

const outputDirectory = new URL('./ir-output/', import.meta.url);
await mkdir(outputDirectory, { recursive: true });

for (const [file, rule] of targets) {
    const source = await readFile(new URL(`./${file}`, import.meta.url), 'utf8');
    const syntaxErrors = new ApexSyntaxErrorCollector();
    const { parser } = ApexParserFactory.createLexerAndParser(source, syntaxErrors);
    const result = new UnitVisitor().visit(rule(parser));

    syntaxErrors.diagnostics.forEach(({ line, column, message }) => {
        console.warn(`${file} ${line}:${column} ${message}`);
    });

    const outputPath = new URL(`./${file.replace(/\.[^.]+$/, '')}.ir.json`, outputDirectory);
    await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
    console.log(`IR written to ${outputPath.pathname}`);
}
