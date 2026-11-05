import { isJSXMemberExpression, type JSXMemberExpression } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
} from '../commonVisitor';
import { jSXIdentifierTypePair, type JSXIdentifierTypeClass } from './jSXIdentifier';

const jSXMemberExpressionObjectPairs = lazyPairs(
    () => [jSXMemberExpressionTypePair, jSXIdentifierTypePair] as const,
);
const jSXMemberExpressionPropertyPairs = lazyPairs(() => [jSXIdentifierTypePair] as const);

export type JSXMemberExpressionFields = {
    object: JSXMemberExpressionTypeClass | JSXIdentifierTypeClass | LwcErrorTypeClass;
    property: JSXIdentifierTypeClass | LwcErrorTypeClass;
};

export class JSXMemberExpressionTypeClass extends LwcCommonTypeClass<'jSXMemberExpression'> {
    private readonly value: JSXMemberExpressionFields;

    private constructor(value: JSXMemberExpressionFields) {
        super('jSXMemberExpression');
        this.value = value;
    }

    static create(
        target: JSXMemberExpression,
        originalSource: string,
    ): JSXMemberExpressionTypeClass {
        return new JSXMemberExpressionTypeClass({
            object: visitNode(
                target.object,
                originalSource,
                jSXMemberExpressionObjectPairs(),
                'JSXMemberExpression.object',
            ),
            property: visitNode(
                target.property,
                originalSource,
                jSXMemberExpressionPropertyPairs(),
                'JSXMemberExpression.property',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): JSXMemberExpressionFields {
        return this.value;
    }

    getObject(): JSXMemberExpressionFields['object'] {
        return this.value.object;
    }

    getProperty(): JSXMemberExpressionFields['property'] {
        return this.value.property;
    }
}

export const jSXMemberExpressionTypePair: EvaluatePair<
    JSXMemberExpression,
    JSXMemberExpressionTypeClass
> = makeEvaluatePair(isJSXMemberExpression, (target, originalSource) =>
    JSXMemberExpressionTypeClass.create(target, originalSource),
);

export const isJSXMemberExpressionType = (
    target: LwcCommonTypeClass<string>,
): target is JSXMemberExpressionTypeClass => target instanceof JSXMemberExpressionTypeClass;
