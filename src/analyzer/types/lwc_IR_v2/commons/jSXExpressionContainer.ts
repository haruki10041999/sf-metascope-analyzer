import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isJSXExpressionContainer, type JSXExpressionContainer } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
    getSourceSpan,
} from '../commonVisitor';
import { expressionVisitorEvaluatePairs, type ExpressionTypeClass } from '../expressionVisitor';
import {
    jSXEmptyExpressionTypePair,
    type JSXEmptyExpressionTypeClass,
} from '../jsxVisitor/jSXEmptyExpression';

const jSXExpressionContainerExpressionPairs = lazyPairs(
    () => [...expressionVisitorEvaluatePairs(), jSXEmptyExpressionTypePair] as const,
);

export type JSXExpressionContainerFields = TypeField<'jSXExpressionContainer'> & {
    expression: ExpressionTypeClass | JSXEmptyExpressionTypeClass;
};

export class JSXExpressionContainerTypeClass extends LwcCommonTypeClass<
    'jSXExpressionContainer',
    JSXExpressionContainerFields
> {
    private constructor(value: FieldsOf<JSXExpressionContainerFields>, sourceSpan: SourceSpan) {
        super('jSXExpressionContainer', value, sourceSpan);
    }

    static create(
        target: JSXExpressionContainer,
        originalSource: string,
    ): JSXExpressionContainerTypeClass {
        return new JSXExpressionContainerTypeClass(
            {
                expression: visitNode(
                    target.expression,
                    originalSource,
                    jSXExpressionContainerExpressionPairs(),
                    'JSXExpressionContainer.expression',
                ),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getExpression(): JSXExpressionContainerFields['expression'] {
        return this.getFields().expression;
    }
}

export const jSXExpressionContainerTypePair: EvaluatePair<
    JSXExpressionContainer,
    JSXExpressionContainerTypeClass
> = makeEvaluatePair(isJSXExpressionContainer, (target, originalSource) =>
    JSXExpressionContainerTypeClass.create(target, originalSource),
);

export const isJSXExpressionContainerType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is JSXExpressionContainerTypeClass => target instanceof JSXExpressionContainerTypeClass;
