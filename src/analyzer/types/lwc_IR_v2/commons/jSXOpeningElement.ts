import { isJSXOpeningElement, type JSXOpeningElement } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
    visitNodeList,
    visitOptionalNode,
} from '../commonVisitor';
import {
    typeParameterInstantiationTypePair,
    type TypeParameterInstantiationTypeClass,
} from '../flowVisitor/typeParameterInstantiation';
import { jSXIdentifierTypePair, type JSXIdentifierTypeClass } from '../jsxVisitor/jSXIdentifier';
import {
    jSXMemberExpressionTypePair,
    type JSXMemberExpressionTypeClass,
} from '../jsxVisitor/jSXMemberExpression';
import {
    jSXNamespacedNameTypePair,
    type JSXNamespacedNameTypeClass,
} from '../jsxVisitor/jSXNamespacedName';
import {
    jSXSpreadAttributeTypePair,
    type JSXSpreadAttributeTypeClass,
} from '../jsxVisitor/jSXSpreadAttribute';
import {
    tSTypeParameterInstantiationTypePair,
    type TSTypeParameterInstantiationTypeClass,
} from '../typeScriptVisitor/tSTypeParameterInstantiation';
import { jSXAttributeTypePair, type JSXAttributeTypeClass } from './jSXAttribute';

const jSXOpeningElementNamePairs = lazyPairs(
    () => [jSXIdentifierTypePair, jSXMemberExpressionTypePair, jSXNamespacedNameTypePair] as const,
);
const jSXOpeningElementAttributesPairs = lazyPairs(
    () => [jSXAttributeTypePair, jSXSpreadAttributeTypePair] as const,
);
const jSXOpeningElementTypeArgumentsPairs = lazyPairs(
    () => [typeParameterInstantiationTypePair, tSTypeParameterInstantiationTypePair] as const,
);

export type JSXOpeningElementFields = {
    name:
        | JSXIdentifierTypeClass
        | JSXMemberExpressionTypeClass
        | JSXNamespacedNameTypeClass
        | LwcErrorTypeClass;
    selfClosing: JSXOpeningElement['selfClosing'];
    attributes: (JSXAttributeTypeClass | JSXSpreadAttributeTypeClass | LwcErrorTypeClass)[];
    typeArguments:
        | TypeParameterInstantiationTypeClass
        | TSTypeParameterInstantiationTypeClass
        | LwcErrorTypeClass
        | null;
};

export class JSXOpeningElementTypeClass extends LwcCommonTypeClass<'jSXOpeningElement'> {
    private readonly value: JSXOpeningElementFields;

    private constructor(value: JSXOpeningElementFields) {
        super('jSXOpeningElement');
        this.value = value;
    }

    static create(target: JSXOpeningElement, originalSource: string): JSXOpeningElementTypeClass {
        return new JSXOpeningElementTypeClass({
            name: visitNode(
                target.name,
                originalSource,
                jSXOpeningElementNamePairs(),
                'JSXOpeningElement.name',
            ),
            selfClosing: target.selfClosing,
            attributes: visitNodeList(
                target.attributes,
                originalSource,
                jSXOpeningElementAttributesPairs(),
                'JSXOpeningElement.attributes',
            ),
            typeArguments: visitOptionalNode(
                target.typeArguments,
                originalSource,
                jSXOpeningElementTypeArgumentsPairs(),
                'JSXOpeningElement.typeArguments',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): JSXOpeningElementFields {
        return this.value;
    }

    getName(): JSXOpeningElementFields['name'] {
        return this.value.name;
    }

    getSelfClosing(): JSXOpeningElementFields['selfClosing'] {
        return this.value.selfClosing;
    }

    getAttributes(): JSXOpeningElementFields['attributes'] {
        return this.value.attributes;
    }

    getTypeArguments(): JSXOpeningElementFields['typeArguments'] {
        return this.value.typeArguments;
    }
}

export const jSXOpeningElementTypePair: EvaluatePair<
    JSXOpeningElement,
    JSXOpeningElementTypeClass
> = makeEvaluatePair(isJSXOpeningElement, (target, originalSource) =>
    JSXOpeningElementTypeClass.create(target, originalSource),
);

export const isJSXOpeningElementType = (
    target: LwcCommonTypeClass<string>,
): target is JSXOpeningElementTypeClass => target instanceof JSXOpeningElementTypeClass;
