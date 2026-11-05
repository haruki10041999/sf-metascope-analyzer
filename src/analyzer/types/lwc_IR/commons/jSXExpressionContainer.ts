import { isJSXExpressionContainer, type JSXExpressionContainer } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
} from '../commonVisitor';
import { expressionVisitorEvaluatePairs, type ExpressionTypeClass } from '../expressionVisitor';
import {
    jSXEmptyExpressionTypePair,
    type JSXEmptyExpressionTypeClass,
} from '../jsxVisitor/jSXEmptyExpression';

const jSXExpressionContainerExpressionPairs = lazyPairs(
    () => [...expressionVisitorEvaluatePairs(), jSXEmptyExpressionTypePair] as const,
);

export type JSXExpressionContainerFields = {
    expression: ExpressionTypeClass | JSXEmptyExpressionTypeClass | LwcErrorTypeClass;
};

export class JSXExpressionContainerTypeClass extends LwcCommonTypeClass<'jSXExpressionContainer'> {
    private readonly value: JSXExpressionContainerFields;

    private constructor(value: JSXExpressionContainerFields) {
        super('jSXExpressionContainer');
        this.value = value;
    }

    static create(
        target: JSXExpressionContainer,
        originalSource: string,
    ): JSXExpressionContainerTypeClass {
        return new JSXExpressionContainerTypeClass({
            expression: visitNode(
                target.expression,
                originalSource,
                jSXExpressionContainerExpressionPairs(),
                'JSXExpressionContainer.expression',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): JSXExpressionContainerFields {
        return this.value;
    }

    getExpression(): JSXExpressionContainerFields['expression'] {
        return this.value.expression;
    }
}

export const jSXExpressionContainerTypePair: EvaluatePair<
    JSXExpressionContainer,
    JSXExpressionContainerTypeClass
> = makeEvaluatePair(isJSXExpressionContainer, (target, originalSource) =>
    JSXExpressionContainerTypeClass.create(target, originalSource),
);

export const isJSXExpressionContainerType = (
    target: LwcCommonTypeClass<string>,
): target is JSXExpressionContainerTypeClass => target instanceof JSXExpressionContainerTypeClass;
