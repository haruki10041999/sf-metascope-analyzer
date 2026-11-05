import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { LwcParser, type LwcResolvedError } from '../../src/analyzer/parser/Lwc';

const BUNDLES = 'docs/examples/lwc/bundles/force-app/main/default/lwc';

/** 比べやすいように、エラーの要点だけにする */
const summary = (errors: LwcResolvedError[]) =>
    errors.map((e) => ({
        phase: e.phase,
        code: e.code,
        contextType: e.contextType,
        at: `${e.start.line}:${e.start.column}-${e.end.line}:${e.end.column}`,
        context: e.context,
    }));

describe('LwcParser (JS / TS)', () => {
    it('正しい TS のバンドルは、IR を作り resolvedError なし', async () => {
        for (const name of ['accountList', 'accountRow', 'utils']) {
            const result = await LwcParser.parseBundleScripts(`${BUNDLES}/${name}`);
            assert.equal(result.scripts.length, 1);
            assert.equal(result.scripts[0]!.filePath, `${name}/${name}.ts`);
            assert.equal(result.scripts[0]!.ir?.getType(), 'file');
            assert.deepEqual(result.resolvedError, []);
        }
    });

    it('TS の LWC の仕様違反は、元の TS の位置で lwc の resolvedError になる', async () => {
        const result = await LwcParser.parseBundleScripts(`${BUNDLES}/broken`);
        assert.equal(result.scripts[0]!.ir?.getType(), 'file');
        assert.deepEqual(summary(result.resolvedError), [
            {
                phase: 'lwc',
                code: 'LWC1093',
                contextType: 'LWC1093',
                at: '4:4-4:8',
                context: '@api',
            },
        ]);
        const [error] = result.resolvedError;
        assert.equal(error!.filePath, 'broken/broken.ts');
        assert.equal(error!.level, 'error');
        // 絶対パス・コードはメッセージから除く
        assert.equal(error!.errorMessage, '@api method or property cannot be used with @track');
        assert.match(error!.sourceKeys.objectKey, /^error_[0-9a-f]{16}$/);
        assert.match(error!.sourceKeys.sourceKey, /^error_[0-9a-f]{16}$/);
    });

    it('LWC の違反の位置は、日本語・絵文字の後ろでも正しい', () => {
        const source = `import { LightningElement, api } from 'lwc';\n// 日本語😀\nexport default class X extends LightningElement {\n    @api dataFoo;\n}`;
        const result = LwcParser.parseScript('x/x.js', source);
        assert.deepEqual(summary(result.resolvedError), [
            {
                phase: 'lwc',
                code: 'LWC1107',
                contextType: 'LWC1107',
                at: '4:4-4:17',
                context: '@api dataFoo;',
            },
        ]);
    });

    it('回復できない構文エラーは IR を作らず、syntax の resolvedError 1 件', () => {
        const result = LwcParser.parseScript('x/x.ts', `export default class A {\n    x = ;\n}`);
        assert.equal(result.ir, null);
        assert.deepEqual(summary(result.resolvedError), [
            {
                phase: 'syntax',
                code: 'TS_SYNTAX',
                contextType: 'UnexpectedToken',
                at: '2:8-2:9',
                context: ';',
            },
        ]);
    });

    it('回復した構文エラーは IR を作る。型の合わないノードの IR エラーは重ねて出さず、LWC の検証もしない', () => {
        const source = `import { LightningElement, api, track } from 'lwc';\n1 = 2;\nexport default class X extends LightningElement { @api @track v; }`;
        const result = LwcParser.parseScript('x/x.js', source);
        assert.equal(result.ir?.getType(), 'file');
        // 1 は IR では UNSUPPORTED_CONTEXT だが、同じ位置の InvalidLhs で報告済み。@api @track は検証しない
        assert.deepEqual(summary(result.resolvedError), [
            {
                phase: 'syntax',
                code: 'JS_SYNTAX',
                contextType: 'InvalidLhs',
                at: '2:0-2:1',
                context: '1',
            },
        ]);
    });

    it('空白にできない TS の構文は TS_UNSUPPORTED にし、LWC の検証をしない', () => {
        const source = `import { LightningElement, api, track } from 'lwc';\nenum E { A }\nexport default class X extends LightningElement { @api @track v: string; }`;
        const result = LwcParser.parseScript('x/x.ts', source);
        assert.deepEqual(summary(result.resolvedError), [
            {
                phase: 'lwc',
                code: 'TS_UNSUPPORTED',
                contextType: 'enum',
                at: '2:0-2:12',
                context: 'enum E { A }',
            },
        ]);
    });

    it('同じ名前の .ts と .js があれば .ts を読み、.js は skippedFiles にする', async () => {
        const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'lwc-'));
        const bundle = path.join(dir, 'hello');
        await fs.mkdir(path.join(bundle, '__tests__'), { recursive: true });
        const component = `import { LightningElement } from 'lwc';\nexport default class Hello extends LightningElement {}\n`;
        await fs.writeFile(path.join(bundle, 'hello.ts'), component);
        await fs.writeFile(path.join(bundle, 'hello.js'), component);
        await fs.writeFile(path.join(bundle, 'shared.js'), 'export const x = 1;\n');
        await fs.writeFile(path.join(bundle, 'hello.test.js'), '');
        await fs.writeFile(path.join(bundle, 'types.d.ts'), '');
        await fs.writeFile(path.join(bundle, '__tests__', 'hello.test.js'), '');
        try {
            const result = await LwcParser.parseBundleScripts(bundle);
            assert.deepEqual(
                result.scripts.map((script) => script.filePath),
                ['hello/hello.ts', 'hello/shared.js'],
            );
            assert.deepEqual(result.skippedFiles, [
                { filePath: 'hello/hello.js', reason: 'compiled from hello.ts' },
            ]);
            assert.deepEqual(result.resolvedError, []);
        } finally {
            await fs.rm(dir, { recursive: true, force: true });
        }
    });
});
