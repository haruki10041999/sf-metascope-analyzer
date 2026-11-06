import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, it } from 'node:test';

import { LwcParser } from '../../src/analyzer/parser/Lwc';

// 同じバンドルの中の突き合わせ (docs/lwc-implementation.md)

const META = (capabilities = '') => `<?xml version="1.0" encoding="UTF-8"?>
<LightningComponentBundle xmlns="http://soap.sforce.com/2006/04/metadata">
    <apiVersion>61.0</apiVersion>
    <isExposed>false</isExposed>${capabilities}
</LightningComponentBundle>`;

/** 一時フォルダに c/<name> のバンドルを作って読み、phase bundle の診断を返す */
const check = async (files: Record<string, string>) => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'lwc-bundle-'));
    const dir = path.join(root, 'demo');
    try {
        await mkdir(dir);
        for (const [name, content] of Object.entries({ 'demo.js-meta.xml': META(), ...files })) {
            await writeFile(path.join(dir, name), content);
        }
        const result = await LwcParser.parseLwcBundle(dir);
        return result.resolvedError
            .filter((e) => e.phase === 'bundle')
            .map((e) => [e.code, e.level, e.contextType, e.filePath]);
    } finally {
        await rm(root, { recursive: true, force: true });
    }
};

const JS = (body: string, header = 'export default class Demo extends LightningElement') =>
    `import { LightningElement } from 'lwc';\n${header} {\n${body}\n}\n`;

describe('バンドルの中の突き合わせ (テンプレート × JS)', () => {
    it('テンプレートの式・ハンドラーが JS のメンバーにないものを warning にする', async () => {
        const found = await check({
            'demo.js': JS('label = "x";\nget visible() { return true; }\nhandleClick() {}'),
            'demo.html': `<template>
    <p lwc:if={visible}>{label} {missing}</p>
    <button onclick={handleClick}>a</button>
    <button onclick={handleOther}>b</button>
    <template for:each={items} for:item="item"><p key={item.id}>{item.name}</p></template>
</template>`,
        });
        assert.deepEqual(found, [
            ['TEMPLATE_UNKNOWN_MEMBER', 'warning', 'missing', 'demo/demo.html'],
            ['TEMPLATE_UNKNOWN_HANDLER', 'warning', 'handleOther', 'demo/demo.html'],
            ['TEMPLATE_UNKNOWN_MEMBER', 'warning', 'items', 'demo/demo.html'],
        ]);
    });

    it('LightningElement 以外を継承・未知の mixin を使うときは、メンバーの確認をしない', async () => {
        const html = '<template>{fromParent}</template>';
        assert.deepEqual(
            await check({
                'demo.js': JS('', 'export default class Demo extends BaseComponent'),
                'demo.html': html,
            }),
            [],
        );
        assert.deepEqual(
            await check({
                'demo.js': JS('', 'export default class Demo extends MyMixin(LightningElement)'),
                'demo.html': html,
            }),
            [],
        );
    });

    it('this.refs.<名前> がテンプレートの lwc:ref にないものを warning にする', async () => {
        const found = await check({
            'demo.js': JS('focus() { this.refs.input.focus(); this.refs.missing.focus(); }'),
            'demo.html': '<template><input lwc:ref="input"></template>',
        });
        assert.deepEqual(found, [['TEMPLATE_UNKNOWN_REF', 'warning', 'missing', 'demo/demo.js']]);
    });

    it('lwc:component は js-meta.xml の capabilities に lightning__dynamicComponent が要る', async () => {
        const files = {
            'demo.js': JS('ctor;'),
            'demo.html': '<template><lwc:component lwc:is={ctor}></lwc:component></template>',
        };
        assert.deepEqual(await check(files), [
            ['TEMPLATE_DYNAMIC_DISABLED', 'warning', 'lwc:component', 'demo/demo.html'],
        ]);
        assert.deepEqual(
            await check({
                ...files,
                'demo.js-meta.xml': META(
                    '\n    <capabilities><capability>lightning__dynamicComponent</capability></capabilities>',
                ),
            }),
            [],
        );
    });
});
