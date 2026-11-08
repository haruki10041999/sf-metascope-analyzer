import { isJSXAttribute, type JSXAttribute } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
    visitOptionalNode,
} from '../commonVisitor';
import { jSXIdentifierTypePair, type JSXIdentifierTypeClass } from '../jsxVisitor/jSXIdentifier';
import {
    jSXNamespacedNameTypePair,
    type JSXNamespacedNameTypeClass,
} from '../jsxVisitor/jSXNamespacedName';
import { jSXElementTypePair, type JSXElementTypeClass } from './jSXElement';
import {
    jSXExpressionContainerTypePair,
    type JSXExpressionContainerTypeClass,
} from './jSXExpressionContainer';
import { jSXFragmentTypePair, type JSXFragmentTypeClass } from './jSXFragment';
import { stringLiteralTypePair, type StringLiteralTypeClass } from './stringLiteral';

const jSXAttributeNamePairs = lazyPairs(
    () => [jSXIdentifierTypePair, jSXNamespacedNameTypePair] as const,
);
const jSXAttributeValuePairs = lazyPairs(
    () =>
        [
            jSXElementTypePair,
            jSXFragmentTypePair,
            stringLiteralTypePair,
            jSXExpressionContainerTypePair,
        ] as const,
);

export type JSXAttributeFields = {
    name: JSXIdentifierTypeClass | JSXNamespacedNameTypeClass | LwcErrorTypeClass;
    value:
        | JSXElementTypeClass
        | JSXFragmentTypeClass
        | StringLiteralTypeClass
        | JSXExpressionContainerTypeClass
        | LwcErrorTypeClass
        | null;
};

export class JSXAttributeTypeClass extends LwcCommonTypeClass<'jSXAttribute'> {
    private readonly value: JSXAttributeFields;

    private constructor(value: JSXAttributeFields) {
        super('jSXAttribute');
        this.value = value;
    }

    static create(target: JSXAttribute, originalSource: string): JSXAttributeTypeClass {
        return new JSXAttributeTypeClass({
            name: visitNode(
                target.name,
                originalSource,
                jSXAttributeNamePairs(),
                'JSXAttribute.name',
            ),
            value: visitOptionalNode(
                target.value,
                originalSource,
                jSXAttributeValuePairs(),
                'JSXAttribute.value',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): JSXAttributeFields {
        return this.value;
    }

    getName(): JSXAttributeFields['name'] {
        return this.value.name;
    }

    getValue(): JSXAttributeFields['value'] {
        return this.value.value;
    }
}

export const jSXAttributeTypePair: EvaluatePair<JSXAttribute, JSXAttributeTypeClass> =
    makeEvaluatePair(isJSXAttribute, (target, originalSource) =>
        JSXAttributeTypeClass.create(target, originalSource),
    );

export const isJSXAttributeType = (
    target: LwcCommonTypeClass<string>,
): target is JSXAttributeTypeClass => target instanceof JSXAttributeTypeClass;
