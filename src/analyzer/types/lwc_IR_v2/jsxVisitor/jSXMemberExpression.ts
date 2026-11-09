import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isJSXMemberExpression, type JSXMemberExpression } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
    getSourceSpan,
} from '../commonVisitor';
import { jSXIdentifierTypePair, JSXIdentifierTypeClass } from './jSXIdentifier';

const jSXMemberExpressionObjectPairs = lazyPairs(
    () => [jSXMemberExpressionTypePair, jSXIdentifierTypePair] as const,
);

export type JSXMemberExpressionFields = TypeField<'jSXMemberExpression'> & {
    object: JSXMemberExpressionTypeClass | JSXIdentifierTypeClass;
    property: JSXIdentifierTypeClass;
};

export class JSXMemberExpressionTypeClass extends LwcCommonTypeClass<
    'jSXMemberExpression',
    JSXMemberExpressionFields
> {
    private constructor(value: FieldsOf<JSXMemberExpressionFields>, sourceSpan: SourceSpan) {
        super('jSXMemberExpression', value, sourceSpan);
    }

    static create(
        target: JSXMemberExpression,
        originalSource: string,
    ): JSXMemberExpressionTypeClass {
        return new JSXMemberExpressionTypeClass(
            {
                object: visitNode(
                    target.object,
                    originalSource,
                    jSXMemberExpressionObjectPairs(),
                    'JSXMemberExpression.object',
                ),
                property: JSXIdentifierTypeClass.create(target.property, originalSource),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getObject(): JSXMemberExpressionFields['object'] {
        return this.getFields().object;
    }

    getProperty(): JSXMemberExpressionFields['property'] {
        return this.getFields().property;
    }
}

export const jSXMemberExpressionTypePair: EvaluatePair<
    JSXMemberExpression,
    JSXMemberExpressionTypeClass
> = makeEvaluatePair(isJSXMemberExpression, (target, originalSource) =>
    JSXMemberExpressionTypeClass.create(target, originalSource),
);

export const isJSXMemberExpressionType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is JSXMemberExpressionTypeClass => target instanceof JSXMemberExpressionTypeClass;
