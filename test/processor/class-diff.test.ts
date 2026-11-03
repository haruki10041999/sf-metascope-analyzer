import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
    ClassBodyDiff,
    getMemberKey,
    makeClassBodyDiff,
    makeClassDiff,
    makeFieldDeclarationDiff,
    makeMethodDiff,
    makePropertyDiff,
} from '../../src/analyzer/processor/Apex/diff/declaration';
import type {
    ClassDeclarationJson,
    ConstructorDeclarationJson,
    FieldDeclarationJson,
    InitializerBlockJson,
    MethodDeclarationJson,
    ModifierJson,
    ModifiersJson,
    ParameterJson,
    PropertyDeclarationJson,
    StatementJson,
    TypeJson,
} from '../../src/analyzer/types';

type ClassBodyItem = ClassDeclarationJson['block'][number];

const keys = (objectKey: string) => ({ objectKey, sourceKey: `${objectKey}-source` });
const structureKeys = (objectKey: string) => ({
    base: keys(objectKey),
    name: keys(`${objectKey}-name`),
});

const primitive = (objectKey: string, primitiveType: string): TypeJson =>
    ({
        kind: 'type',
        sourceKeys: keys(objectKey),
        type: 'primitive',
        primitiveType,
    }) as TypeJson;

const param = (objectKey: string, variant: string, type = 'Integer'): ParameterJson => ({
    kind: 'parameter',
    sourceKeys: keys(objectKey),
    variant,
    variantType: primitive(`${objectKey}-type`, type),
    modifier: {},
});

const statement = (objectKey: string): StatementJson => ({
    kind: 'break',
    sourceKeys: keys(objectKey),
    value: 'break',
});

const modifier = (objectKey: string, name: ModifierJson['name']): ModifiersJson => ({
    access: [{ kind: 'modifier', sourceKeys: keys(objectKey), name }],
});

const method = (
    objectKey: string,
    name: string,
    params: ParameterJson[],
    block?: StatementJson[],
): MethodDeclarationJson => ({
    kind: 'method',
    sourceKeys: structureKeys(objectKey),
    name,
    returnType: 'void',
    param: params,
    ...(block ? { block } : {}),
});

const member = <T extends object>(declaration: T, modifiers: ModifiersJson = {}) => ({
    ...declaration,
    modifier: modifiers,
});

const constructorOf = (objectKey: string, params: ParameterJson[]): ConstructorDeclarationJson => ({
    kind: 'constructor',
    sourceKeys: structureKeys(objectKey),
    name: ['Foo'],
    param: params,
    block: [],
});

const field = (objectKey: string, names: string[], init?: string): FieldDeclarationJson => ({
    kind: 'field',
    sourceKeys: keys(objectKey),
    variantType: primitive(`${objectKey}-type`, 'Integer'),
    variants: names.map((name) => ({ name, ...(init ? { init } : {}) })),
});

const initializer = (block: StatementJson[], isStatic = false): InitializerBlockJson => ({
    kind: 'initializer',
    block,
    modifier: {},
    isStatic,
});

const summarize = (diffs: ClassBodyDiff[]) =>
    diffs.map((d) => [d.kind, d.status, d.index, 'match' in d ? d.match : undefined]);

describe('class member keys', () => {
    it('identifies members by kind and signature', () => {
        assert.equal(
            getMemberKey(member(method('m', 'run', [param('p', 'x')]))),
            'method:run({"type":"primitive","primitiveType":"Integer"})',
        );
        assert.equal(getMemberKey(member(constructorOf('c', []))), 'constructor:()');
        assert.equal(getMemberKey(member(field('f', ['a', 'b']))), 'field:a,b');
    });
});

describe('class body diff', () => {
    it('does not treat a modifier-only change as unchanged', () => {
        const before: ClassBodyItem[] = [
            member(method('m', 'run', [], []), modifier('pub', 'PUBLIC')),
        ];
        const after: ClassBodyItem[] = [
            member(method('m', 'run', [], []), modifier('pri', 'PRIVATE')),
        ];

        const [diff] = makeClassBodyDiff(before, after);
        assert.ok(diff && diff.kind === 'method' && diff.status === 'changed' && 'fields' in diff);
        assert.equal(diff.match, 'key');
        assert.deepEqual(
            diff.modifier.map((m) => m.status),
            ['removed', 'added'],
        );
        assert.equal(diff.fields.name.status, 'unchanged');
    });

    it('treats the same declaration and modifiers as unchanged', () => {
        const before: ClassBodyItem[] = [member(method('m', 'run', []), modifier('pub', 'PUBLIC'))];
        const after: ClassBodyItem[] = [member(method('m', 'run', []), modifier('pub', 'PUBLIC'))];

        const [diff] = makeClassBodyDiff(before, after);
        assert.equal(diff?.status, 'unchanged');
    });

    it('matches overloads by signature and reports a signature change as removed / added', () => {
        const before: ClassBodyItem[] = [
            member(method('m1', 'run', [param('p1', 'x')], [statement('s1')])),
            member(method('m2', 'run', [param('p2', 'x', 'String')])),
        ];
        const after: ClassBodyItem[] = [
            // String 版は Id 版に変わった (シグネチャが違うので別物)
            member(method('m3', 'run', [param('p3', 'x', 'Id')])),
            // Integer 版は本体だけ変わった
            member(method('m4', 'run', [param('p1', 'x')], [statement('s2')])),
        ];

        assert.deepEqual(summarize(makeClassBodyDiff(before, after)), [
            ['method', 'changed', { before: 0, after: 1 }, 'key'],
            ['method', 'removed', 1, undefined],
            ['method', 'added', 0, undefined],
        ]);
    });

    it('compares initializers as a sequence and others as a set', () => {
        const notSet = { kind: 'notSet' as const, sourceKeys: keys('semicolon') };
        const before: ClassBodyItem[] = [
            initializer([statement('a')]),
            notSet,
            initializer([statement('b')], true),
        ];
        const after: ClassBodyItem[] = [
            initializer([statement('b')], true),
            { ...notSet, sourceKeys: { ...notSet.sourceKeys, sourceKey: 'moved' } },
            initializer([statement('a')]),
        ];

        assert.deepEqual(summarize(makeClassBodyDiff(before, after)), [
            ['initializer', 'moved', { before: 0, after: 2 }, 'identical'],
            ['notSet', 'unchanged', { before: 1, after: 1 }, undefined],
            ['initializer', 'unchanged', { before: 2, after: 0 }, undefined],
        ]);
    });

    it('diffs nested classes recursively', () => {
        const inner = (objectKey: string, block: ClassBodyItem[]): ClassDeclarationJson => ({
            kind: 'class',
            sourceKeys: structureKeys(objectKey),
            name: 'Inner',
            block,
        });
        const before: ClassDeclarationJson = {
            kind: 'class',
            sourceKeys: structureKeys('outer1'),
            name: 'Outer',
            block: [member(inner('inner1', [member(field('f1', ['a']))]))],
        };
        const after: ClassDeclarationJson = {
            kind: 'class',
            sourceKeys: structureKeys('outer2'),
            name: 'Outer',
            extend: primitive('base', 'Object'),
            block: [member(inner('inner2', [member(field('f2', ['a'], '1'))]))],
        };

        const diff = makeClassDiff(before, after);
        assert.ok(diff.status === 'changed' && 'fields' in diff);
        assert.equal(diff.fields.extend.status, 'added');
        const [innerDiff] = diff.fields.block;
        assert.ok(innerDiff && innerDiff.kind === 'class' && innerDiff.status === 'changed');
        assert.ok('fields' in innerDiff);
        assert.deepEqual(summarize(innerDiff.fields.block), [
            ['field', 'changed', { before: 0, after: 0 }, 'key'],
        ]);
    });
});

describe('member diff', () => {
    it('distinguishes a missing body from an empty body', () => {
        const diff = makeMethodDiff(method('m1', 'run', []), method('m2', 'run', [], []));
        assert.ok(diff.status === 'changed' && 'fields' in diff);
        assert.deepEqual(diff.fields.block, { status: 'added', value: [] });
    });

    it('diffs the statements of a body as a sequence', () => {
        const diff = makeMethodDiff(
            method('m1', 'run', [], [statement('a'), statement('b')]),
            method('m2', 'run', [], [statement('a'), statement('c')]),
        );
        assert.ok(diff.status === 'changed' && 'fields' in diff);
        assert.ok(Array.isArray(diff.fields.block));
        assert.deepEqual(
            diff.fields.block.map((d) => d.status),
            ['unchanged', 'changed'],
        );
    });

    it('distinguishes an auto-implemented accessor from an empty one', () => {
        const property = (objectKey: string, block?: StatementJson[]): PropertyDeclarationJson => ({
            kind: 'property',
            sourceKeys: structureKeys(objectKey),
            name: 'value',
            variantType: primitive(`${objectKey}-type`, 'Integer'),
            isGetter: true,
            getterContent: { modifier: {}, ...(block ? { block } : {}) },
            isSetter: false,
        });

        const diff = makePropertyDiff(property('p1'), property('p2', []));
        assert.ok(diff.status === 'changed' && 'fields' in diff);
        const getter = diff.fields.getterContent;
        assert.ok('block' in getter);
        assert.deepEqual(getter.block, { status: 'added', value: [] });
        assert.deepEqual(diff.fields.setterContent, { status: 'unchanged', value: undefined });
    });

    it('matches field variables by name', () => {
        const diff = makeFieldDeclarationDiff(field('f1', ['a', 'b']), field('f2', ['b', 'c']));
        assert.ok(diff.status === 'changed' && 'fields' in diff);
        assert.ok(Array.isArray(diff.fields.variants));
        assert.deepEqual(
            diff.fields.variants.map((v) => [v.status, v.index]),
            [
                ['removed', 0],
                ['unchanged', { before: 1, after: 0 }],
                ['added', 1],
            ],
        );
    });
});
