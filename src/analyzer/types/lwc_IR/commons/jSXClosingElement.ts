import { isJSXClosingElement, type JSXClosingElement } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
} from '../commonVisitor';
import { jSXIdentifierTypePair, type JSXIdentifierTypeClass } from '../jsxVisitor/jSXIdentifier';
import {
    jSXMemberExpressionTypePair,
    type JSXMemberExpressionTypeClass,
} from '../jsxVisitor/jSXMemberExpression';
import {
    jSXNamespacedNameTypePair,
    type JSXNamespacedNameTypeClass,
} from '../jsxVisitor/jSXNamespacedName';

const jSXClosingElementNamePairs = lazyPairs(
    () => [jSXIdentifierTypePair, jSXMemberExpressionTypePair, jSXNamespacedNameTypePair] as const,
);

export type JSXClosingElementFields = {
    name:
        | JSXIdentifierTypeClass
        | JSXMemberExpressionTypeClass
        | JSXNamespacedNameTypeClass
        | LwcErrorTypeClass;
};

export class JSXClosingElementTypeClass extends LwcCommonTypeClass<'jSXClosingElement'> {
    private readonly value: JSXClosingElementFields;

    private constructor(value: JSXClosingElementFields) {
        super('jSXClosingElement');
        this.value = value;
    }

    static create(target: JSXClosingElement, originalSource: string): JSXClosingElementTypeClass {
        return new JSXClosingElementTypeClass({
            name: visitNode(
                target.name,
                originalSource,
                jSXClosingElementNamePairs(),
                'JSXClosingElement.name',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): JSXClosingElementFields {
        return this.value;
    }

    getName(): JSXClosingElementFields['name'] {
        return this.value.name;
    }
}

export const jSXClosingElementTypePair: EvaluatePair<
    JSXClosingElement,
    JSXClosingElementTypeClass
> = makeEvaluatePair(isJSXClosingElement, (target, originalSource) =>
    JSXClosingElementTypeClass.create(target, originalSource),
);

export const isJSXClosingElementType = (
    target: LwcCommonTypeClass<string>,
): target is JSXClosingElementTypeClass => target instanceof JSXClosingElementTypeClass;
