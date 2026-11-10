import assert from 'node:assert/strict';
import fs from 'node:fs';
import { describe, it } from 'node:test';

import { ApexParserFactory } from '@apexdevtools/apex-parser';

import { apexSampleOf, sourceOf } from '../../docs/examples/paths';
import { ApexCommonErrorListener } from '../../src/analyzer/parser/Apex/errorListener';
import { LwcCommonErrorListener } from '../../src/analyzer/parser/Lwc/errorListener';
import { getScriptLanguage, parseScript } from '../../src/analyzer/parser/Lwc/script';
import { buildApexIr } from '../../src/analyzer/types/apex_IR/commonVisitor';
import {
    AnonymousUnitTypeClass,
    CompilationUnitTypeClass,
} from '../../src/analyzer/types/apex_IR/unitVisitor';
import { type CommonTypeClass, type TypeField } from '../../src/analyzer/types/commons/ir';
import { buildLwcIr } from '../../src/analyzer/types/lwc_IR/commonVisitor';
import { fileTypePair } from '../../src/analyzer/types/lwc_IR/standardizedVisitor/file';

// IR v2: 作れなかったところは解析木に残さず、リスナーの resolvedError に出す (docs/ir.md 4 章)

const read = (file: string) => fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');

/** 木のノードの種類 (エラーのノード analyzerError がないことを確かめる) */
const typesIn = (node: CommonTypeClass<string, TypeField<string>>, found = new Set<string>()) => {
    found.add(node.getType());
    node.getChildNodes().forEach((child) => typesIn(child, found));
    return found;
};

const buildApex = (source: string, anonymous: boolean) => {
    const listener = new ApexCommonErrorListener(source);
    const { parser } = ApexParserFactory.createLexerAndParser(source, listener);
    const built = anonymous
        ? buildApexIr(
              parser.anonymousUnit(),
              (c) => AnonymousUnitTypeClass.create(c),
              'anonymousUnit',
          )
        : buildApexIr(
              parser.compilationUnit(),
              (c) => CompilationUnitTypeClass.create(c),
              'compilationUnit',
          );
    listener.irErrors(built.errors);
    return { built, listener };
};

describe('IR v2 のエラー (解析木に残さず resolvedError に出す)', () => {
    it('Apex: 構文エラーのないクラスは IR のエラーがなく、木を作れる', () => {
        const { built, listener } = buildApex(
            read(apexSampleOf('after', 'AccountService.cls')),
            false,
        );
        assert.ok(built.result);
        assert.deepEqual(built.errors, []);
        assert.equal(listener.getResolvedErrors().length, 0);
    });

    it('Apex: 壊れた匿名 Apex は、壊れた文を除いた木を作り、エラーは構文エラーだけを出す', () => {
        const { built, listener } = buildApex(read(apexSampleOf('after', 'broken.apex')), true);
        assert.ok(built.result);
        assert.ok(!typesIn(built.result).has('analyzerError'));
        // IR を作れなかったところはある (構文エラーの結果)
        assert.ok(built.errors.length > 0);
        // resolvedError は構文エラーだけ
        const resolved = listener.getResolvedErrors();
        assert.ok(resolved.length > 0);
        assert.ok(resolved.every((error) => error.phase === 'syntax'));
    });

    it('Apex: 途中で切れたクラスでも例外は外に出ない', () => {
        const source = read(apexSampleOf('after', 'AccountService.cls'));
        for (let i = 1; i < 10; i++) {
            const { built } = buildApex(
                source.slice(0, Math.floor((source.length * i) / 10)),
                false,
            );
            if (built.result) assert.ok(!typesIn(built.result).has('analyzerError'));
        }
    });

    it('LWC: サンプルの JS / TS は IR のエラーなく木を作れる', () => {
        for (const file of [
            sourceOf('before', 'lwc', 'accountList', 'accountList.ts'),
            sourceOf('after', 'lwc', 'newBanner', 'newBanner.js'),
        ]) {
            const source = read(file);
            const listener = new LwcCommonErrorListener(source);
            const { ast } = parseScript(source, getScriptLanguage(file));
            assert.ok(ast, file);
            const built = buildLwcIr(ast, source, [fileTypePair], 'LwcParser');
            listener.irErrors(built.errors);
            assert.ok(built.result, file);
            assert.deepEqual(built.errors, [], file);
            assert.ok(!typesIn(built.result).has('analyzerError'));
        }
    });
});
