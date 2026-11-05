import { isJSXSpreadChild, type JSXSpreadChild } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    makeEvaluatePair,
    visitNode,
} from '../commonVisitor';
import { expressionVisitorEvaluatePairs, type ExpressionTypeClass } from '../expressionVisitor';

export type JSXSpreadChildFields = {
    expression: ExpressionTypeClass | LwcErrorTypeClass;
};

export class JSXSpreadChildTypeClass extends LwcCommonTypeClass<'jSXSpreadChild'> {
    private readonly value: JSXSpreadChildFields;

    private constructor(value: JSXSpreadChildFields) {
        super('jSXSpreadChild');
        this.value = value;
    }

    static create(target: JSXSpreadChild, originalSource: string): JSXSpreadChildTypeClass {
        return new JSXSpreadChildTypeClass({
            expression: visitNode(
                target.expression,
                originalSource,
                expressionVisitorEvaluatePairs(),
                'ExpressionVisitor',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): JSXSpreadChildFields {
        return this.value;
    }

    getExpression(): JSXSpreadChildFields['expression'] {
        return this.value.expression;
    }
}

export const jSXSpreadChildTypePair: EvaluatePair<JSXSpreadChild, JSXSpreadChildTypeClass> =
    makeEvaluatePair(isJSXSpreadChild, (target, originalSource) =>
        JSXSpreadChildTypeClass.create(target, originalSource),
    );

export const isJSXSpreadChildType = (
    target: LwcCommonTypeClass<string>,
): target is JSXSpreadChildTypeClass => target instanceof JSXSpreadChildTypeClass;
