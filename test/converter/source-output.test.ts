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
import { SourceNode } from '../../src/analyzer/types/apex/converter/commons';

const isRecord = (value: unknown): value is Record<string, unknown> =>
    value !== null && typeof value === 'object';

const checkSourceTree = (converted: unknown, source: SourceNode, path = 'converted') => {
    assert.ok(isRecord(converted), path);
    if (source.type !== null) assert.equal(converted.type, source.type, path);
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
    it('keeps detailed syntax diagnostics and original text out of the converted result', () => {
        const source = 'Integer a = ;';
        const { convertedResult, sourceResult } = parseConverterSample(
            'invalid.apex',
            source,
            (parser) => parser.anonymousUnit(),
        );
        assert.ok(convertedResult.syntaxErrorCount > 0);
        assert.equal(convertedResult.syntaxErrorCount, sourceResult.syntaxErrors.length);
        assert.equal(sourceResult.sourceText, source);
        assert.equal(Object.hasOwn(convertedResult, 'source'), false);
        assert.equal(Object.hasOwn(convertedResult, 'sourceText'), false);
        assert.equal(Object.hasOwn(convertedResult, 'syntaxErrors'), false);
        assert.equal(convertedResult.sourceHash, createHash('sha256').update(source).digest('hex'));
        assert.equal(convertedResult.sourceHash, sourceResult.sourceHash);
        assert.ok(sourceResult.conversionErrors.length > 0);
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
                assert.ok(typeof sidecar.sourceText === 'string');
                assert.equal(
                    output.sourceHash,
                    createHash('sha256').update(sidecar.sourceText).digest('hex'),
                );
                assert.equal(Object.hasOwn(output, 'source'), false);
                const source = sidecar.source;
                assert.ok(isRecord(source));
                const parsed = parseConverterSample(
                    String(output.file),
                    sidecar.sourceText,
                    (parser) => {
                        if (name === 'ParserTest') return parser.compilationUnit();
                        if (name === 'ParserTrigger') return parser.triggerUnit();
                        return parser.anonymousUnit();
                    },
                );
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
