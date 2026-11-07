/**
 * LWC のサンプル accountList.ts を Babel AST → lwc_IR → converter まで実行し、
 * converter の CommonType 出力だけを書き出す。JSON 化・sourceKeys 生成・LWC 検証は行わない。
 *
 * 実行: npx ttsx --noCheck docs/examples/lwc/scripts/run-ir-converter.ts
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { sourceOf } from '../../paths';
import { getScriptLanguage, parseScript } from '../../../../src/analyzer/parser/Lwc/script';
import {
    collectErrorTypeClasses,
    visitWithPairs,
} from '../../../../src/analyzer/types/lwc_IR/commonVisitor';
import { convertLwcFile } from '../../../../src/analyzer/types/lwc/converter/commons';
import {
    fileTypePair,
    isFileType,
} from '../../../../src/analyzer/types/lwc_IR/standardizedVisitor/file';

const here = path.dirname(fileURLToPath(import.meta.url));
const sourcePath = path.join(sourceOf('before', 'lwc'), 'accountList', 'accountList.ts');
const filePath = 'accountList/accountList.ts';
const outputPath = path.resolve(here, '../output/converter/before/accountList.json');

const source = await readFile(sourcePath, 'utf8');
const { ast, syntaxErrors } = parseScript(source, getScriptLanguage(sourcePath));
if (!ast) {
    throw new Error(
        `Babel could not parse ${filePath}: ${syntaxErrors.map((error) => error.message).join('; ')}`,
    );
}
if (syntaxErrors.length > 0) {
    throw new Error(
        `Babel reported syntax errors in ${filePath}: ${syntaxErrors.map((error) => error.message).join('; ')}`,
    );
}

const ir = visitWithPairs(ast, source, [fileTypePair], 'LwcIRConverterExample');
if (!isFileType(ir)) {
    throw new Error(`Could not create the file IR for ${filePath}: ${ir.getParseErrorMessage()}`);
}

const converted = convertLwcFile(ir, filePath);
const errors = collectErrorTypeClasses(ir);

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(converted, null, 2)}\n`);
console.log(`Wrote converter output: ${path.relative(process.cwd(), outputPath)}`);
console.log(`IR conversion errors: ${errors.length}`);
