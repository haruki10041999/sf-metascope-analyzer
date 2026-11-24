import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
    makeEnumDiff,
    getInterfaceMethodKey,
    makeInterfaceDiff,
} from '../../src/analyzer/processor/Apex/diff/declaration';
import type {
    EnumConstantJson,
    EnumDeclarationJson,
    InterfaceDeclarationJson,
    InterfaceMethodJson,
    ParameterJson,
} from '../../src/analyzer/types';

const keys = (objectKey: string) => ({ objectKey, sourceKey: `${objectKey}-source` });
/** 宣言のキーと名前の位置 (apex 9 から宣言も JsonType。名前の位置は nameRef) */
const declarationKeys = (objectKey: string) => ({
    sourceKeys: keys(objectKey),
    nameRef: {
        kind: 'declarationName' as const,
        sourceKeys: keys(objectKey + '-name'),
        name: objectKey,
    },
});

const integerParam = (objectKey: string, variant: string): ParameterJson => ({
    kind: 'parameter',
    sourceKeys: keys(objectKey),
    variant,
    variantType: {
        kind: 'type',
        sourceKeys: keys(`${objectKey}-type`),
        type: 'primitive',
        primitiveType: 'Integer',
    },
    modifier: {
        kind: 'modifiers',
        sourceKeys: { objectKey: 'modifiers-empty', sourceKey: 'modifiers-source' },
    },
});

const method = (objectKey: string, name: string, param: ParameterJson[]): InterfaceMethodJson => ({
    kind: 'interfaceMethod',
    ...declarationKeys(objectKey),
    name,
    returnType: 'void',
    param,
    modifier: {
        kind: 'modifiers',
        sourceKeys: { objectKey: 'modifiers-empty', sourceKey: 'modifiers-source' },
    },
});

const constant = (objectKey: string, name: string): EnumConstantJson => ({
    kind: 'enumConstant',
    sourceKeys: keys(objectKey),
    name,
});

describe('declaration diff', () => {
    it('identifies interface methods by name and parameter types', () => {
        assert.equal(
            getInterfaceMethodKey(method('m', 'run', [integerParam('p', 'x')])),
            'run({"type":"primitive","primitiveType":"Integer"})',
        );
    });

    it('matches interface methods by key and reports renamed ones as removed / added', () => {
        const before: InterfaceDeclarationJson = {
            kind: 'interface',
            ...declarationKeys('i1'),
            name: 'Runner',
            block: [method('run1', 'run', [integerParam('p1', 'x')]), method('stop1', 'stop', [])],
        };
        const after: InterfaceDeclarationJson = {
            kind: 'interface',
            ...declarationKeys('i2'),
            name: 'Runner',
            block: [
                method('halt1', 'halt', []),
                // 引数名だけ変えた (シグネチャは同じ) → 同じメソッドの changed
                method('run2', 'run', [integerParam('p2', 'y')]),
            ],
        };

        const diff = makeInterfaceDiff(before, after);
        assert.ok(diff.status === 'changed' && 'fields' in diff);
        assert.deepEqual(diff.fields.name, { status: 'unchanged', value: 'Runner' });
        assert.ok(Array.isArray(diff.fields.block));
        assert.deepEqual(
            diff.fields.block.map((d) => [d.status, d.index, 'match' in d ? d.match : undefined]),
            [
                ['changed', { before: 0, after: 1 }, 'key'],
                ['removed', 1, undefined],
                ['added', 0, undefined],
            ],
        );
    });

    it('compares enum constants as a sequence', () => {
        const before: EnumDeclarationJson = {
            kind: 'enum',
            ...declarationKeys('e1'),
            name: 'Color',
            members: [constant('red', 'RED'), constant('green', 'GREEN'), constant('blue', 'BLUE')],
        };
        const after: EnumDeclarationJson = {
            kind: 'enum',
            ...declarationKeys('e2'),
            name: 'Color',
            members: [constant('red', 'RED'), constant('lime', 'LIME'), constant('blue', 'BLUE')],
        };

        const diff = makeEnumDiff(before, after);
        assert.ok(diff.status === 'changed' && 'fields' in diff);
        assert.ok(Array.isArray(diff.fields.members));
        assert.deepEqual(
            diff.fields.members.map((d) => d.status),
            ['unchanged', 'changed', 'unchanged'],
        );
    });
});
