import { before, describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { collectErrors, formatErrors, parse } from './helpers';

type UnitModule = typeof import('../../src/analyzer/types/apex_IR/unitVisitor');
let unit: UnitModule;

before(async () => {
    unit = await import('../../src/analyzer/types/apex_IR/unitVisitor');
});

const visitClass = (source: string) => {
    const result = new unit.UnitVisitor().visit(parse(source, (p) => p.compilationUnit()));
    assert.ok(unit.isCompilationUnitType(result), result.getType());
    return result;
};

const assertNoErrors = (node: unknown) => {
    const errors = collectErrors(node);
    assert.equal(errors.length, 0, formatErrors(errors));
};

describe('unitVisitor / declarationVisitor', () => {
    it('空のクラス本体をエラーなしで変換できる', () => {
        assertNoErrors(visitClass('public class A { }'));
    });

    it('フィールド・コンストラクタ・メソッド・プロパティを含むクラス', () => {
        assertNoErrors(
            visitClass(`
                public with sharing class A extends B implements C, D {
                    private static final Integer MAX = 10;
                    private String uninitialized;
                    private Account acc = new Account();
                    ;
                    public String name { get; private set; }
                    public A() { this.name = 'x'; }
                    @AuraEnabled
                    public static List<String> run(String a, Integer b) { return null; }
                    public void noop() { }
                    public class Inner { }
                    public enum Color { RED, GREEN }
                }
            `),
        );
    });

    it('void / 型付きメソッドを持つインターフェース', () => {
        assertNoErrors(
            visitClass(`
                public interface I {
                    void run();
                    String name(Integer x);
                }
            `),
        );
    });

    it('空の匿名 Apex / 空のトリガー本体をエラーなしで変換できる', () => {
        const anonymous = new unit.UnitVisitor().visit(parse('', (p) => p.anonymousUnit()));
        assert.ok(unit.isAnonymousUnitType(anonymous), anonymous.getType());
        assertNoErrors(anonymous);

        const trigger = new unit.UnitVisitor().visit(
            parse('trigger T on Account (before insert) { }', (p) => p.triggerUnit()),
        );
        assert.ok(unit.isTriggerUnitType(trigger), trigger.getType());
        assertNoErrors(trigger);
    });

    it('inherited sharing は INHERITED_SHARING になる', async () => {
        const modifier = await import('../../src/analyzer/types/apex_IR/modifierVisitor');
        const result = new modifier.ModifierVisitor().visit(
            parse('inherited sharing', (p) => p.modifier()),
        );
        assert.equal(result.getValue(), 'INHERITED_SHARING');
    });

    it('匿名 Apex を変換できる', () => {
        const ctx = parse("System.debug('x');", (p) => p.anonymousUnit());
        const result = new unit.UnitVisitor().visit(ctx);
        assert.ok(unit.isAnonymousUnitType(result), result.getType());
        assertNoErrors(result);
    });

    it('トリガーを変換できる', () => {
        const ctx = parse(
            'trigger AccTrigger on Account (before insert, after update) { System.debug(1); }',
            (p) => p.triggerUnit(),
        );
        const result = new unit.UnitVisitor().visit(ctx);
        assert.ok(unit.isTriggerUnitType(result), result.getType());
        assertNoErrors(result);
    });
});
