import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isJSXSpreadChild, type JSXSpreadChild } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    visitNode,
    getSourceSpan,
} from '../commonVisitor';
import { expressionVisitorEvaluatePairs, type ExpressionTypeClass } from '../expressionVisitor';

export type JSXSpreadChildFields = TypeField<'jSXSpreadChild'> & {
    expression: ExpressionTypeClass;
};

export class JSXSpreadChildTypeClass extends LwcCommonTypeClass<
    'jSXSpreadChild',
    JSXSpreadChildFields
> {
    private constructor(value: FieldsOf<JSXSpreadChildFields>, sourceSpan: SourceSpan) {
        super('jSXSpreadChild', value, sourceSpan);
    }

    static create(target: JSXSpreadChild, originalSource: string): JSXSpreadChildTypeClass {
        return new JSXSpreadChildTypeClass(
            {
                expression: visitNode(
                    target.expression,
                    originalSource,
                    expressionVisitorEvaluatePairs(),
                    'ExpressionVisitor',
                ),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getExpression(): JSXSpreadChildFields['expression'] {
        return this.getFields().expression;
    }
}

export const jSXSpreadChildTypePair: EvaluatePair<JSXSpreadChild, JSXSpreadChildTypeClass> =
    makeEvaluatePair(isJSXSpreadChild, (target, originalSource) =>
        JSXSpreadChildTypeClass.create(target, originalSource),
    );

export const isJSXSpreadChildType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is JSXSpreadChildTypeClass => target instanceof JSXSpreadChildTypeClass;
