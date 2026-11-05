import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import { parse, type ParserOptions } from '@babel/parser';

import { makeBabelOptions } from '../../src/analyzer/parser/Lwc/script';
import {
    collectErrorTypeClasses,
    LwcCommonTypeClass,
} from '../../src/analyzer/types/lwc_IR/commonVisitor';
import { StandardizedVisitor } from '../../src/analyzer/types/lwc_IR/standardizedVisitor';
import { isFileType } from '../../src/analyzer/types/lwc_IR/standardizedVisitor/file';
import { isClassMethodType } from '../../src/analyzer/types/lwc_IR/commons/classMethod';

type Plugins = NonNullable<ParserOptions['plugins']>;
const DECORATORS: Plugins = ['decorators'];

// lwc-parse-plan.md 3.1.1 の設定 (plugins だけ差し替える)
const parseLwc = (source: string, plugins: Plugins) => {
    const ast = parse(source, { ...makeBabelOptions('js'), plugins });
    return { ast, ir: new StandardizedVisitor().visit(ast, source) };
};

/** IR をたどり、LwcErrorTypeClass と、すべてのノードを集める */
const collect = (root: LwcCommonTypeClass<string>) => {
    const nodes: LwcCommonTypeClass<string>[] = [];
    const walk = (node: LwcCommonTypeClass<string>): void => {
        nodes.push(node);
        node.getChildNodes().forEach(walk);
    };
    walk(root);
    return { errors: collectErrorTypeClasses(root), nodes };
};

const BUNDLES = 'docs/examples/lwc/bundles/force-app/main/default/lwc';

describe('lwc_IR', () => {
    for (const file of [
        'accountList/accountList.ts',
        'accountRow/accountRow.ts',
        'utils/utils.ts',
    ]) {
        it(`${file} を IR エラーなしで変換できる`, () => {
            const source = fs.readFileSync(`${BUNDLES}/${file}`, 'utf8');
            const { ast, ir } = parseLwc(source, ['typescript', ...DECORATORS]);
            assert.deepEqual(ast.errors, []);
            assert.ok(isFileType(ir));
            assert.deepEqual(collect(ir).errors, []);
        });
    }

    it('Flow の構文を IR エラーなしで変換できる', () => {
        const source = `type T = { a: number, b?: ?string };\nopaque type O = string;\nfunction f<X>(x: X): T | null { return (null: any); }\ndeclare function g(x: number): void;\nenum E { A, B }`;
        const { ir } = parseLwc(source, [['flow', { all: true, enums: true }]]);
        assert.deepEqual(collect(ir).errors, []);
    });

    it('JSX の構文を IR エラーなしで変換できる', () => {
        const source = `const el = <div className="a" {...p}><Foo.Bar x={1} />{c && <span>t</span>}<></></div>;`;
        const { ir } = parseLwc(source, ['jsx']);
        assert.deepEqual(collect(ir).errors, []);
    });

    it('ノードにソース位置（span）が付く', () => {
        const source = `class A {\n    @api\n    run(x) {}\n}`;
        const { ir } = parseLwc(source, DECORATORS);
        const method = collect(ir).nodes.find(isClassMethodType);
        assert.ok(method);
        assert.equal(method.getKind(), 'method');
        assert.equal(method.getDecorators()?.length, 1);
        assert.deepEqual(method.getSpan()?.start, { offset: 14, line: 2, column: 4 });
    });

    it('回復した構文エラーの、型に合わないノードは UNSUPPORTED_CONTEXT になり、親は残る', () => {
        const source = `1 = 2; (a, 1) => a; let b; let b;`;
        const { ast, ir } = parseLwc(source, DECORATORS);
        assert.deepEqual(
            ast.errors.map((e) => e.reasonCode),
            ['InvalidLhs', 'InvalidLhsBinding', 'VarRedeclaration'],
        );
        const { errors, nodes } = collect(ir);
        assert.deepEqual(
            errors.map((e) => [e.getCode(), e.getContextType(), e.getSpan()?.start.offset]),
            [
                ['UNSUPPORTED_CONTEXT', 'NumericLiteral', 0],
                ['UNSUPPORTED_CONTEXT', 'NumericLiteral', 11],
            ],
        );
        assert.ok(nodes.some((n) => n.getType() === 'assignmentExpression'));
        assert.ok(nodes.some((n) => n.getType() === 'arrowFunctionExpression'));
    });
});
