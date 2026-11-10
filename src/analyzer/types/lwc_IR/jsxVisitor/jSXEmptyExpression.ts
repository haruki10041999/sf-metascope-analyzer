import { type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isJSXEmptyExpression, type JSXEmptyExpression } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    getSourceSpan,
} from '../commonVisitor';

export type JSXEmptyExpressionFields = TypeField<'jSXEmptyExpression'>;

export class JSXEmptyExpressionTypeClass extends LwcCommonTypeClass<
    'jSXEmptyExpression',
    JSXEmptyExpressionFields
> {
    private constructor(sourceSpan: SourceSpan) {
        super('jSXEmptyExpression', {}, sourceSpan);
    }

    static create(target: JSXEmptyExpression, originalSource: string): JSXEmptyExpressionTypeClass {
        return new JSXEmptyExpressionTypeClass(getSourceSpan(target, originalSource));
    }
}

export const jSXEmptyExpressionTypePair: EvaluatePair<
    JSXEmptyExpression,
    JSXEmptyExpressionTypeClass
> = makeEvaluatePair(isJSXEmptyExpression, (target, originalSource) =>
    JSXEmptyExpressionTypeClass.create(target, originalSource),
);

export const isJSXEmptyExpressionType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is JSXEmptyExpressionTypeClass => target instanceof JSXEmptyExpressionTypeClass;
