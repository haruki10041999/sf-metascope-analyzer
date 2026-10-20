import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, it } from 'node:test';

import {
    generateConverterOutputs,
    parseConverterSample,
} from '../../docs/examples/apex-ir/generate-converter-output';
import { finalizeSourceTree, SourceNode } from '../../src/analyzer/types/apex/converter/commons';

const isRecord = (value: unknown): value is Record<string, unknown> =>
    value !== null && typeof value === 'object';

const checkSourceTree = (converted: unknown, source: SourceNode, path = 'converted') => {
    assert.ok(isRecord(converted), path);
    if (source.type !== null) assert.equal(converted.type, source.type, path);
    const children = Object.values(source.fields).flatMap((child) =>
        Array.isArray(child) ? child.filter((item) => item !== null) : child ? [child] : [],
    );
    if (source.span) {
        assert.equal(
            Object.hasOwn(source.span, 'context'),
            children.length === 0,
            `${path}: context must only be stored at leaves`,
        );
    }
    for (const [key, child] of Object.entries(source.fields)) {
        assert.ok(Object.hasOwn(converted, key), `${path}.${key}`);
        if (Array.isArray(child)) {
            const values: unknown = converted[key];
            assert.ok(Array.isArray(values), `${path}.${key}`);
            assert.equal(values.length, child.length, `${path}.${key}`);
            child.forEach((node, index) => {
                if (node) checkSourceTree(values[index], node, `${path}.${key}[${index}]`);
            });
        } else if (child) {
            checkSourceTree(converted[key], child, `${path}.${key}`);
        }
    }
};

describe('converter source sidecars', () => {
    const makeNode = (context: string): SourceNode => ({
        type: 'test',
        span: {
            context,
            start: { offset: 0, line: 1, column: 0 },
            end: { offset: context.length, line: 1, column: context.length },
        },
        fields: {},
    });

    it('keeps context only at leaves while preserving parent coordinates', () => {
        const node = makeNode('parent');
        const leaf = makeNode('child');
        node.fields.value = leaf;
        const start = node.span?.start;
        const end = node.span?.end;
        const converted = { type: 'test', value: { type: 'test', value: 'child' } };
        finalizeSourceTree(node, converted);
        assert.equal(node.span?.context, undefined);
        assert.equal(leaf.span?.context, 'child');
        assert.deepEqual(node.span, { start, end });
        const once = JSON.stringify(node);
        finalizeSourceTree(node, converted);
        assert.equal(JSON.stringify(node), once);
    });

    it('stops at the current node on an error, without collapsing unaffected siblings', () => {
        const root = makeNode('root');
        const broken = makeNode('broken expression');
        const sibling = makeNode('valid sibling');
        broken.fields.left = makeNode('already converted');
        root.fields.value = [broken, sibling];
        finalizeSourceTree(root, {
            type: 'test',
            value: [
                {
                    type: 'test',
                    left: { type: 'test', value: 'already converted' },
                    right: { errorCode: 'TYPE_MISMATCH', index: 1 },
                },
                { type: 'test', value: 'valid sibling' },
            ],
        });
        assert.equal(root.span?.context, undefined);
        assert.equal(broken.span?.context, 'broken expression');
        assert.deepEqual(broken.fields, {});
        assert.equal(sibling.span?.context, 'valid sibling');
    });

    it('retains the nearest positioned node when an error occurs in an unpositioned group', () => {
        const node = makeNode('if statement');
        node.fields.value = [{ type: null, span: null, fields: {} }];
        finalizeSourceTree(node, {
            type: 'test',
            value: [{ condition: { errorCode: 'TYPE_MISMATCH', index: 1 }, block: null }],
        });
        assert.equal(node.span?.context, 'if statement');
        assert.deepEqual(node.fields, {});
    });

    it('retains context when only null or empty child slots exist', () => {
        const node = makeNode('leaf');
        node.fields.value = [null];
        node.fields.empty = [];
        finalizeSourceTree(node, { type: 'test', value: [null], empty: [] });
        assert.equal(node.span?.context, 'leaf');
    });

    it('stops on syntax recovery errors even when conversion produced no error reference', () => {
        const node = makeNode('parent');
        node.fields.value = makeNode('child');
        finalizeSourceTree(node, { type: 'test', value: { type: 'test', value: 'child' } }, [
            { line: 1, column: 6 },
        ]);
        assert.equal(node.span?.context, 'parent');
        assert.deepEqual(node.fields, {});
    });

    it('routes syntax diagnostics to a child without retaining ancestor context', () => {
        const node = makeNode('parent');
        const child = makeNode('child');
        node.fields.value = child;
        finalizeSourceTree(node, { type: 'test', value: { type: 'test', value: 'child' } }, [
            { line: 1, column: 2 },
        ]);
        assert.equal(node.span?.context, undefined);
        assert.equal(child.span?.context, 'child');
    });

    it('keeps error diagnostics but does not persist the complete original text', () => {
        const source = 'Integer a = ;';
        const { convertedResult, sourceResult } = parseConverterSample(
            'invalid.apex',
            source,
            (parser) => parser.anonymousUnit(),
        );
        assert.ok(convertedResult.syntaxErrorCount > 0);
        assert.equal(convertedResult.syntaxErrorCount, sourceResult.syntaxErrors.length);
        assert.equal(Object.hasOwn(sourceResult, 'sourceText'), false);
        assert.equal(Object.hasOwn(convertedResult, 'source'), false);
        assert.equal(Object.hasOwn(convertedResult, 'sourceText'), false);
        assert.equal(Object.hasOwn(convertedResult, 'syntaxErrors'), false);
        assert.equal(convertedResult.sourceHash, createHash('sha256').update(source).digest('hex'));
        assert.equal(convertedResult.sourceHash, sourceResult.sourceHash);
        assert.ok(sourceResult.conversionErrors.length > 0);
        assert.ok(sourceResult.source);
        checkSourceTree(convertedResult.converted, sourceResult.source);
        sourceResult.conversionErrors.forEach((error, index) => {
            assert.equal(error.index, index + 1);
            assert.deepEqual(convertedResult.conversionErrors[index], {
                errorCode: error.errorCode,
                index: error.index,
            });
        });
    });

    it('generates separate readable files for all three samples with matching source paths', async () => {
        const directory = await mkdtemp(join(tmpdir(), 'metascope-source-output-'));
        try {
            const base = pathToFileURL(`${directory}${sep}`);
            await generateConverterOutputs(base);
            for (const name of ['ParserTest', 'ParserTrigger', 'parser']) {
                const outputFile = new URL(`converter-output/${name}.converted.json`, base);
                const output: unknown = JSON.parse(await readFile(outputFile, 'utf8'));
                assert.ok(isRecord(output));
                assert.equal(output.syntaxErrorCount, 0);
                assert.deepEqual(output.conversionErrors, []);
                assert.equal(typeof output.sourceFile, 'string');
                assert.ok(typeof output.sourceFile === 'string');
                const sidecar: unknown = JSON.parse(
                    await readFile(new URL(output.sourceFile, outputFile), 'utf8'),
                );
                assert.ok(isRecord(sidecar));
                assert.equal(sidecar.file, output.file);
                assert.equal(sidecar.sourceHash, output.sourceHash);
                assert.equal(Object.hasOwn(sidecar, 'sourceText'), false);
                assert.ok(typeof output.file === 'string');
                const sourceText = await readFile(
                    new URL(`../../docs/examples/apex-ir/${output.file}`, import.meta.url),
                    'utf8',
                );
                assert.equal(
                    output.sourceHash,
                    createHash('sha256').update(sourceText).digest('hex'),
                );
                assert.equal(Object.hasOwn(output, 'source'), false);
                const source = sidecar.source;
                assert.ok(isRecord(source));
                const parsed = parseConverterSample(String(output.file), sourceText, (parser) => {
                    if (name === 'ParserTest') return parser.compilationUnit();
                    if (name === 'ParserTrigger') return parser.triggerUnit();
                    return parser.anonymousUnit();
                });
                assert.ok(parsed.sourceResult.source);
                assert.deepEqual(source, parsed.sourceResult.source);
                assert.deepEqual(output.converted, parsed.convertedResult.converted);
                checkSourceTree(output.converted, parsed.sourceResult.source);
            }
        } finally {
            await rm(directory, { recursive: true });
        }
    });
});
