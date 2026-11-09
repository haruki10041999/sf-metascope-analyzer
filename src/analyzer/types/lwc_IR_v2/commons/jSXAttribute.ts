import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isJSXAttribute, type JSXAttribute } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
    visitOptionalNode,
    getSourceSpan,
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

export type JSXAttributeFields = TypeField<'jSXAttribute'> & {
    name: JSXIdentifierTypeClass | JSXNamespacedNameTypeClass;
    value:
        | JSXElementTypeClass
        | JSXFragmentTypeClass
        | StringLiteralTypeClass
        | JSXExpressionContainerTypeClass
        | null;
};

export class JSXAttributeTypeClass extends LwcCommonTypeClass<'jSXAttribute', JSXAttributeFields> {
    private constructor(value: FieldsOf<JSXAttributeFields>, sourceSpan: SourceSpan) {
        super('jSXAttribute', value, sourceSpan);
    }

    static create(target: JSXAttribute, originalSource: string): JSXAttributeTypeClass {
        return new JSXAttributeTypeClass(
            {
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
            },
            getSourceSpan(target, originalSource),
        );
    }

    getName(): JSXAttributeFields['name'] {
        return this.getFields().name;
    }

    getValue(): JSXAttributeFields['value'] {
        return this.getFields().value;
    }
}

export const jSXAttributeTypePair: EvaluatePair<JSXAttribute, JSXAttributeTypeClass> =
    makeEvaluatePair(isJSXAttribute, (target, originalSource) =>
        JSXAttributeTypeClass.create(target, originalSource),
    );

export const isJSXAttributeType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is JSXAttributeTypeClass => target instanceof JSXAttributeTypeClass;
