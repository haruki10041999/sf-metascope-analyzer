import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { convertLwcModule, parseLwcModule } from '../../src/analyzer/parser/Lwc/module';
import type { LwcPropertyJson } from '../../src/analyzer/types';

// getter と setter をまとめたプロパティ (lwcProperty) のキー (docs/plan.md 10 章 P1。サンプルにないので、ここで確かめる)

const propertyOf = (setterBody: string): LwcPropertyJson => {
    const source = [
        "import { LightningElement, api } from 'lwc';",
        'export default class Demo extends LightningElement {',
        '    _size;',
        '    @api',
        '    get size() { return this._size; }',
        `    set size(value) { ${setterBody} }`,
        '}',
    ].join('\n');
    const { module } = convertLwcModule(parseLwcModule('demo/demo.js', source));
    assert.ok(module);
    const property = module.component?.block.find(
        (member): member is LwcPropertyJson => member.kind === 'lwcProperty',
    );
    assert.ok(property);
    return property;
};

describe('getter と setter をまとめたプロパティのキー', () => {
    it('setter の中身だけを変えても objectKey が変わる (両方のアクセサーの中身から作る)', () => {
        const before = propertyOf('this._size = value;');
        const after = propertyOf('this._size = value || 0;');
        assert.ok(before.isGetter && before.isSetter);
        assert.notEqual(before.sourceKeys.objectKey, after.sourceKeys.objectKey);
        // 同じ中身なら同じキー
        assert.equal(
            before.sourceKeys.objectKey,
            propertyOf('this._size = value;').sourceKeys.objectKey,
        );
    });
});
