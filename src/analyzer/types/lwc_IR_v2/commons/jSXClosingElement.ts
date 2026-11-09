import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isJSXClosingElement, type JSXClosingElement } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
    getSourceSpan,
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

export type JSXClosingElementFields = TypeField<'jSXClosingElement'> & {
    name: JSXIdentifierTypeClass | JSXMemberExpressionTypeClass | JSXNamespacedNameTypeClass;
};

export class JSXClosingElementTypeClass extends LwcCommonTypeClass<
    'jSXClosingElement',
    JSXClosingElementFields
> {
    private constructor(value: FieldsOf<JSXClosingElementFields>, sourceSpan: SourceSpan) {
        super('jSXClosingElement', value, sourceSpan);
    }

    static create(target: JSXClosingElement, originalSource: string): JSXClosingElementTypeClass {
        return new JSXClosingElementTypeClass(
            {
                name: visitNode(
                    target.name,
                    originalSource,
                    jSXClosingElementNamePairs(),
                    'JSXClosingElement.name',
                ),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getName(): JSXClosingElementFields['name'] {
        return this.getFields().name;
    }
}

export const jSXClosingElementTypePair: EvaluatePair<
    JSXClosingElement,
    JSXClosingElementTypeClass
> = makeEvaluatePair(isJSXClosingElement, (target, originalSource) =>
    JSXClosingElementTypeClass.create(target, originalSource),
);

export const isJSXClosingElementType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is JSXClosingElementTypeClass => target instanceof JSXClosingElementTypeClass;
