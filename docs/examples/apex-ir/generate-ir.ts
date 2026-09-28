import { readFile, writeFile } from 'node:fs/promises';

import { ApexParserFactory } from '@apexdevtools/apex-parser';
import { UnitVisitor } from '../../../src/analyzer/types/apex/unitVisitor';

type ParseToken = {
    text: string;
};

type ParseNode = {
    ruleIndex?: number;
    children?: ParseNode[] | null;
    symbol?: ParseToken;
    getText(): string;
};

const sourcePath = new URL('./ParserTest.cls', import.meta.url);
const parseTreePath = new URL('./ParserTest.parse-tree.txt', import.meta.url);
const contextTreePath = new URL('./ParserTest.context-tree.json', import.meta.url);
const contextOutlinePath = new URL('./ParserTest.context-tree.txt', import.meta.url);
const resultPath = new URL('./ParserTest.ir.json', import.meta.url);
const errorPath = new URL('./ParserTest.ir-error.txt', import.meta.url);
const source = await readFile(sourcePath, 'utf8');
const parser = ApexParserFactory.createParser(source);

const compilationUnit = parser.compilationUnit();
const parseTree = compilationUnit.toStringTree(parser.ruleNames, parser);
await writeFile(parseTreePath, `${parseTree}\n`, 'utf8');
console.log(`Parse tree written to ${parseTreePath.pathname}`);

const serializeNode = (node: ParseNode): object => {
    if (typeof node.ruleIndex === 'number') {
        return {
            context: parser.ruleNames[node.ruleIndex] ?? `rule#${node.ruleIndex}`,
            children: (node.children ?? []).map(serializeNode),
        };
    }

    return {
        token: node.getText(),
    };
};

const contextTree = serializeNode(compilationUnit as ParseNode);
await writeFile(contextTreePath, `${JSON.stringify(contextTree, null, 2)}\n`, 'utf8');
console.log(`Context tree written to ${contextTreePath.pathname}`);

const formatNode = (node: ParseNode, depth = 0): string[] => {
    const indent = '  '.repeat(depth);
    if (typeof node.ruleIndex === 'number') {
        const contextName = parser.ruleNames[node.ruleIndex] ?? `rule#${node.ruleIndex}`;
        const children = (node.children ?? []).flatMap((child) => formatNode(child, depth + 1));
        return [`${indent}${contextName}`, ...children];
    }

    return [`${indent}- ${JSON.stringify(node.getText())}`];
};

await writeFile(
    contextOutlinePath,
    `${formatNode(compilationUnit as ParseNode).join('\n')}\n`,
    'utf8',
);
console.log(`Context outline written to ${contextOutlinePath.pathname}`);

try {
    const result = new UnitVisitor().visit(compilationUnit);

    await writeFile(resultPath, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
    console.log(`IR written to ${resultPath.pathname}`);
} catch (error) {
    const message = error instanceof Error ? (error.stack ?? error.message) : String(error);
    await writeFile(errorPath, `${message}\n`, 'utf8');
    console.error(`IR generation failed; details written to ${errorPath.pathname}`);
    throw error;
}
