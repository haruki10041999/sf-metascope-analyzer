import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isJSXOpeningElement, type JSXOpeningElement } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
    visitNodeList,
    visitOptionalNode,
    getSourceSpan,
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

export type JSXOpeningElementFields = TypeField<'jSXOpeningElement'> & {
    name: JSXIdentifierTypeClass | JSXMemberExpressionTypeClass | JSXNamespacedNameTypeClass;
    selfClosing: JSXOpeningElement['selfClosing'];
    attributes: (JSXAttributeTypeClass | JSXSpreadAttributeTypeClass)[];
    typeArguments:
        TypeParameterInstantiationTypeClass | TSTypeParameterInstantiationTypeClass | null;
};

export class JSXOpeningElementTypeClass extends LwcCommonTypeClass<
    'jSXOpeningElement',
    JSXOpeningElementFields
> {
    private constructor(value: FieldsOf<JSXOpeningElementFields>, sourceSpan: SourceSpan) {
        super('jSXOpeningElement', value, sourceSpan);
    }

    static create(target: JSXOpeningElement, originalSource: string): JSXOpeningElementTypeClass {
        return new JSXOpeningElementTypeClass(
            {
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
            },
            getSourceSpan(target, originalSource),
        );
    }

    getName(): JSXOpeningElementFields['name'] {
        return this.getFields().name;
    }

    getSelfClosing(): JSXOpeningElementFields['selfClosing'] {
        return this.getFields().selfClosing;
    }

    getAttributes(): JSXOpeningElementFields['attributes'] {
        return this.getFields().attributes;
    }

    getTypeArguments(): JSXOpeningElementFields['typeArguments'] {
        return this.getFields().typeArguments;
    }
}

export const jSXOpeningElementTypePair: EvaluatePair<
    JSXOpeningElement,
    JSXOpeningElementTypeClass
> = makeEvaluatePair(isJSXOpeningElement, (target, originalSource) =>
    JSXOpeningElementTypeClass.create(target, originalSource),
);

export const isJSXOpeningElementType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is JSXOpeningElementTypeClass => target instanceof JSXOpeningElementTypeClass;
