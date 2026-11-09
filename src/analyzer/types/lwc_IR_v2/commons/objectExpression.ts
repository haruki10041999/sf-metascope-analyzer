import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isObjectExpression, type ObjectExpression } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNodeList,
    getSourceSpan,
} from '../commonVisitor';
import { objectMethodTypePair, type ObjectMethodTypeClass } from './objectMethod';
import { objectPropertyTypePair, type ObjectPropertyTypeClass } from './objectProperty';
import { spreadElementTypePair, type SpreadElementTypeClass } from './spreadElement';

const objectExpressionPropertiesPairs = lazyPairs(
    () => [objectMethodTypePair, objectPropertyTypePair, spreadElementTypePair] as const,
);

export type ObjectExpressionFields = TypeField<'objectExpression'> & {
    properties: (ObjectMethodTypeClass | ObjectPropertyTypeClass | SpreadElementTypeClass)[];
};

export class ObjectExpressionTypeClass extends LwcCommonTypeClass<
    'objectExpression',
    ObjectExpressionFields
> {
    private constructor(value: FieldsOf<ObjectExpressionFields>, sourceSpan: SourceSpan) {
        super('objectExpression', value, sourceSpan);
    }

    static create(target: ObjectExpression, originalSource: string): ObjectExpressionTypeClass {
        return new ObjectExpressionTypeClass(
            {
                properties: visitNodeList(
                    target.properties,
                    originalSource,
                    objectExpressionPropertiesPairs(),
                    'ObjectExpression.properties',
                ),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getProperties(): ObjectExpressionFields['properties'] {
        return this.getFields().properties;
    }
}

export const objectExpressionTypePair: EvaluatePair<ObjectExpression, ObjectExpressionTypeClass> =
    makeEvaluatePair(isObjectExpression, (target, originalSource) =>
        ObjectExpressionTypeClass.create(target, originalSource),
    );

export const isObjectExpressionType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is ObjectExpressionTypeClass => target instanceof ObjectExpressionTypeClass;
