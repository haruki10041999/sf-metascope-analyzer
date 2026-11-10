import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

import { LwcParser, parseStylesheet } from '../../src/analyzer/parser/Lwc';
import type { CssAtRuleJson, CssRuleJson, LwcStylesheetJson } from '../../src/analyzer/types';

// LWC の CSS の JSON と検証 (docs/lwc-implementation.md)

const BUNDLES = 'docs/examples/repository/before/force-app/main/default/lwc';

const parse = (source: string, filePath = 'x/x.css') => parseStylesheet(filePath, source);
const stylesheetOf = (source: string) => parse(source).stylesheet as LwcStylesheetJson;

describe('LWC の CSS (JSON)', () => {
    it('規則・宣言・at 規則・カスタムプロパティを JSON にする', async () => {
        const source = (await readFile(`${BUNDLES}/accountList/accountList.css`, 'utf8')).replace(
            /\r\n/g,
            '\n',
        );
        const result = parse(source, 'accountList/accountList.css');
        assert.deepEqual(result.resolvedError, []);
        const stylesheet = result.stylesheet as LwcStylesheetJson;
        assert.equal(stylesheet.kind, 'lwcStylesheet');
        assert.deepEqual(
            stylesheet.rules.map((r) => (r.kind === 'cssRule' ? r.selector : `@${r.name}`)),
            [':host', '.parent, .total', '.tile', '@media'],
        );

        const host = stylesheet.rules[0] as CssRuleJson;
        assert.equal(host.usesHost, true);
        assert.deepEqual(host.declarations[1], {
            prop: '--account-list-gap',
            value: '0.5rem',
            important: false,
            defines: '--account-list-gap',
        });

        const tile = stylesheet.rules[2] as CssRuleJson;
        assert.deepEqual(tile.declarations[1], {
            prop: 'border-bottom',
            value: '1px solid var(--slds-g-color-border-base-1, #c9c9c9)',
            important: true,
            uses: ['--slds-g-color-border-base-1'],
        });

        const media = stylesheet.rules[3] as CssAtRuleJson;
        assert.equal(media.params, '(max-width: 480px)');
        assert.equal((media.rules![0] as CssRuleJson).selector, '.tile');

        // ソース位置は filePath 付きで登録される
        const tileSource = result.sourceObjects.find(
            (s) => s.objectKey === tile.sourceKeys.objectKey,
        )!;
        assert.equal(tileSource.source[0]!.filePath, 'accountList/accountList.css');
        assert.ok(tileSource.context.startsWith('.tile {'));
    });

    it('空白の書き方が違っても objectKey は同じ。位置が変われば sourceKey が変わる', () => {
        const a = stylesheetOf('.a,.b{color:red}');
        const b = stylesheetOf('\n\n.a ,\n  .b {\n    color:   red;\n}\n');
        assert.equal(a.rules[0]!.sourceKeys.objectKey, b.rules[0]!.sourceKeys.objectKey);
        assert.notEqual(a.rules[0]!.sourceKeys.sourceKey, b.rules[0]!.sourceKeys.sourceKey);
    });

    it('@import は imports に入れ、rules には入れない', () => {
        const stylesheet = stylesheetOf(
            '@import \'c/shared\';\n@import "c/theme";\n.a { color: red; }',
        );
        assert.deepEqual(stylesheet.imports, ['c/shared', 'c/theme']);
        assert.equal(stylesheet.rules.length, 1);
    });

    it('*.scoped.css は scoped: true', () => {
        assert.equal(parse('.a { color: red; }', 'x/x.scoped.css').scoped, true);
        assert.equal(parse('.a { color: red; }', 'x/x.css').scoped, false);
    });
});

describe('LWC の CSS (検証)', () => {
    it('構文エラーは JSON を作らず (null)、CSS_SYNTAX の resolvedError にする', () => {
        const result = parse('.a { color: red;\n');
        assert.equal(result.stylesheet, null);
        assert.deepEqual(result.sourceObjects, []);
        assert.deepEqual(
            result.resolvedError.map((e) => [e.phase, e.code, e.errorMessage]),
            [['syntax', 'CSS_SYNTAX', 'Unclosed block']],
        );
    });

    it('LWC の仕様違反は、複数あってもすべて resolvedError にする (JSON は作る)', () => {
        const result = parse(':root { color: red; }\n#foo { color: blue; }\n.ok { color: red; }\n');
        assert.equal(result.stylesheet?.kind, 'lwcStylesheet');
        assert.deepEqual(
            result.resolvedError.map((e) => [e.phase, e.code, e.start.line, e.context]),
            [
                ['lwc', 'LWC_CSS', 1, ':root'],
                ['lwc', 'LWC_CSS', 2, 'foo'],
            ],
        );
    });

    it('バンドルの CSS の診断は、バンドルの resolvedError に入る', async () => {
        const result = await LwcParser.parseLwcBundle(`${BUNDLES}/broken`);
        assert.equal(result.dataType, 'lwcBundle');
        const css = result.resolvedError.filter((e) => e.filePath === 'broken/broken.css');
        assert.deepEqual(
            css.map((e) => [e.code, e.context]),
            [['LWC_CSS', ':root']],
        );
        if (result.dataType === 'lwcBundle') {
            assert.deepEqual(
                result.result.base.stylesheets.map((s) => [s.fileName, s.stylesheet?.kind]),
                [['broken.css', 'lwcStylesheet']],
            );
        }
    });
});
