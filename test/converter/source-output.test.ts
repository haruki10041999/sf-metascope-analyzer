import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, it } from 'node:test';

import {
    generateConverterOutputs,
    parseConverterSample,
} from '../../docs/examples/apex-ir/generate-converter-output';
import {
    extractSourceInfo,
    isCommonTypeExtractSourceInfoType,
    makeHashKeyAndSplit,
} from '../../src/analyzer/types/apex/commons';
import { isSoqlIdType } from '../../src/analyzer/types/apex/converter';

const isRecord = (value: unknown): value is Record<string, unknown> =>
    value !== null && typeof value === 'object';

const checkSourceInfoRemoved = (value: unknown, path = 'converted'): number => {
    if (Array.isArray(value)) {
        return value.reduce<number>(
            (count, item, index) => count + checkSourceInfoRemoved(item, `${path}[${index}]`),
            0,
        );
    }
    if (!isRecord(value)) return 0;

    assert.equal(Object.hasOwn(value, 'sourceInfo'), false, `${path}.sourceInfo`);
    return (
        (typeof value.type === 'string' ? 1 : 0) +
        Object.entries(value).reduce(
            (count, [key, child]) => count + checkSourceInfoRemoved(child, `${path}.${key}`),
            0,
        )
    );
};

describe('converter source info', () => {
    it('validates source-info-extracted CommonTypes recursively', () => {
        const sourceInfo = {
            context: 'Account',
            start: { offset: 0, line: 1, column: 0 },
            end: { offset: 7, line: 1, column: 7 },
        };
        const converted = extractSourceInfo({
            type: 'soqlId',
            sourceInfo,
            value: { type: 'id', sourceInfo, value: 'Account' },
        });

        assert.equal(isCommonTypeExtractSourceInfoType(converted, isSoqlIdType), true);
        assert.equal(
            isCommonTypeExtractSourceInfoType(
                { ...converted, value: { type: 'id', value: 1 } },
                isSoqlIdType,
            ),
            false,
        );
    });

    it('removes source info recursively from nested CommonTypes', () => {
        const sourceInfo = (context: string, offset: number) => ({
            context,
            start: { offset, line: 1, column: offset },
            end: { offset: offset + context.length, line: 1, column: offset + context.length },
        });
        const rootInfo = sourceInfo('root', 0);
        const firstInfo = sourceInfo('first', 1);
        const secondInfo = sourceInfo('second', 7);
        const target = {
            type: 'root',
            sourceInfo: rootInfo,
            value: [
                { type: 'leaf', sourceInfo: firstInfo, value: 'one' },
                { type: 'leaf', sourceInfo: secondInfo, value: 'two' },
            ],
            metadata: { label: 'nested' },
        };

        const result = extractSourceInfo(target);

        assert.deepEqual(result, {
            type: 'root',
            value: [
                { type: 'leaf', value: 'one' },
                { type: 'leaf', value: 'two' },
            ],
            metadata: { label: 'nested' },
        });
        assert.equal(checkSourceInfoRemoved(result), 3);
    });

    it('keeps object hashes independent from source info', async () => {
        const makeNode = (rootContext: string, childContext: string, value: string) => ({
            type: 'root',
            sourceInfo: {
                context: rootContext,
                start: { offset: 0, line: 1, column: 0 },
                end: { offset: rootContext.length, line: 1, column: rootContext.length },
            },
            child: {
                type: 'leaf',
                sourceInfo: {
                    context: childContext,
                    start: { offset: 1, line: 1, column: 1 },
                    end: {
                        offset: childContext.length + 1,
                        line: 1,
                        column: childContext.length + 1,
                    },
                },
                value,
            },
        });

        const first = await makeHashKeyAndSplit(makeNode('root a', 'child a', 'same'), []);
        const relocated = await makeHashKeyAndSplit(makeNode('root b', 'child b', 'same'), []);
        const changed = await makeHashKeyAndSplit(makeNode('root a', 'child a', 'changed'), []);

        assert.equal(first.objectKey, relocated.objectKey);
        assert.notEqual(first.sourceKey, relocated.sourceKey);
        assert.notEqual(first.objectKey, changed.objectKey);
    });

    it('keeps source info on partially converted output and lists conversion errors', () => {
        const result = parseConverterSample('invalid.apex', 'Integer a = ;', (parser) =>
            parser.anonymousUnit(),
        );
        assert.ok(result.syntaxErrors.length > 0);
        assert.ok(checkSourceInfoRemoved(result.converted) > 0);
        result.conversionErrors.forEach((error, index) => assert.equal(error.index, index + 1));
    });

    it('generates a single output per sample with source info on every typed node', async () => {
        const directory = await mkdtemp(join(tmpdir(), 'metascope-converter-output-'));
        try {
            const base = pathToFileURL(`${directory}${sep}`);
            await generateConverterOutputs(base);
            for (const name of ['ParserTest', 'ParserTrigger', 'parser']) {
                const outputFile = new URL(`converter-output/${name}.converted.json`, base);
                const output: unknown = JSON.parse(await readFile(outputFile, 'utf8'));
                assert.ok(isRecord(output));
                assert.deepEqual(output.syntaxErrors, []);
                assert.deepEqual(output.conversionErrors, []);
                assert.equal(Object.hasOwn(output, 'sourceFile'), false);
                const nodeCount = checkSourceInfoRemoved(output.converted);
                assert.ok(nodeCount > 100, name);
            }
        } finally {
            await rm(directory, { recursive: true });
        }
    });
});
