import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { describe, it } from 'node:test';

import AjvModule from 'ajv/dist/2020.js';

import { DOCUMENT_SCHEMA, TEMPLATES_DIR } from '../../docs/catalog/generate';

// 文書の JSON Schema (docs/catalog/report-document.schema.json。エディターの補完)。
// 雛形のファイルが通り、部品・provider の名前の誤り・props・引数の型の誤りを見つけ、${...}・$note・$state は通す

// ajv は CommonJS の default export
const Ajv2020 = ((AjvModule as unknown as { default?: unknown }).default ?? AjvModule) as new (
    options: Record<string, unknown>,
) => {
    compile: (schema: unknown) => ((value: unknown) => boolean) & {
        errors?: { instancePath: string; message?: string }[] | null;
    };
};

describe('文書の JSON Schema', async () => {
    const schema = JSON.parse(await fs.readFile(DOCUMENT_SCHEMA, 'utf8'));
    const validate = new Ajv2020({ strict: false, allErrors: true }).compile(schema);
    const errorsOf = (value: unknown) =>
        validate(value) ? [] : (validate.errors ?? []).map((e) => `${e.instancePath} ${e.message}`);

    const document = (element: Record<string, unknown>) => ({
        $schema: '../report-document.schema.json',
        title: 't',
        data: {},
        spec: { root: 'a', elements: { a: { children: [], ...element } } },
    });
    const table = (data: Record<string, unknown>) =>
        document({
            type: 'DataTable',
            props: { columns: null, caption: null, onlyChanged: null },
            data,
        });

    it('雛形のファイル (docs/catalog/templates) は、すべて通る', async () => {
        const files = await fs.readdir(TEMPLATES_DIR);
        assert.ok(files.length >= 15);
        for (const file of files) {
            const template = JSON.parse(await fs.readFile(path.join(TEMPLATES_DIR, file), 'utf8'));
            assert.equal(template.$schema, '../report-document.schema.json');
            assert.deepEqual(errorsOf(template), [], file);
        }
    });

    it('部品・provider の名前の誤り、props・引数の型の誤り、足りない props を見つける', () => {
        assert.ok(
            errorsOf(document({ type: 'DataTabel', props: {} })).some((e) =>
                e.startsWith('/spec/elements/a/type'),
            ),
        );
        assert.ok(
            errorsOf(table({ provider: 'apex.outlin' })).some((e) =>
                e.startsWith('/spec/elements/a/data/provider'),
            ),
        );
        assert.ok(
            errorsOf(table({ provider: 'apex.outline', args: { classes: 'x' } })).some((e) =>
                e.startsWith('/spec/elements/a/data/args/classes'),
            ),
        );
        assert.ok(
            errorsOf(
                document({
                    type: 'Card',
                    props: {
                        title: 'x',
                        description: null,
                        maxWidth: 'huge',
                        centered: null,
                        className: null,
                    },
                }),
            ).some((e) => e.startsWith('/spec/elements/a/props/maxWidth')),
        );
        assert.ok(
            errorsOf(document({ type: 'Narrative', props: { title: 'x' } })).some((e) =>
                e.includes("required property 'markdown'"),
            ),
        );
    });

    it('省略と短い書き方 (入れ子・省いた props と children・data・"@名前") を通す', () => {
        assert.deepEqual(
            errorsOf({
                title: 't',
                spec: {
                    root: {
                        type: 'Stack',
                        children: [
                            { type: 'Narrative', props: { markdown: '概要' } },
                            { key: 'flows', type: 'DataTable', data: { provider: 'flow.list' } },
                            { type: 'DataTable', props: { rows: '@flows' } },
                        ],
                    },
                },
            }),
            [],
        );
        // 入れ子の要素も確かめる
        assert.ok(
            errorsOf({
                title: 't',
                spec: { root: { type: 'Stack', children: [{ type: 'Nope' }] } },
            }).some((e) => e.startsWith('/spec/root/children/0/type')),
        );
    });

    it('${...}・$note・$state は値として通す。データの部品の rows は書かなくてよい', () => {
        assert.deepEqual(
            errorsOf(table({ provider: 'apex.callFlow', args: { depth: '${params.depth}' } })),
            [],
        );
        assert.deepEqual(
            errorsOf(
                document({ type: 'Narrative', props: { title: null, markdown: { $note: 'k' } } }),
            ),
            [],
        );
        assert.deepEqual(
            errorsOf(
                document({
                    type: 'DataTable',
                    props: {
                        rows: { $state: '/data/x' },
                        columns: null,
                        caption: null,
                        onlyChanged: null,
                    },
                }),
            ),
            [],
        );
    });
});
