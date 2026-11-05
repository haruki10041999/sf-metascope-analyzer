import { isObjectExpression, type ObjectExpression } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNodeList,
} from '../commonVisitor';
import { objectMethodTypePair, type ObjectMethodTypeClass } from './objectMethod';
import { objectPropertyTypePair, type ObjectPropertyTypeClass } from './objectProperty';
import { spreadElementTypePair, type SpreadElementTypeClass } from './spreadElement';

const objectExpressionPropertiesPairs = lazyPairs(
    () => [objectMethodTypePair, objectPropertyTypePair, spreadElementTypePair] as const,
);

export type ObjectExpressionFields = {
    properties: (
        ObjectMethodTypeClass | ObjectPropertyTypeClass | SpreadElementTypeClass | LwcErrorTypeClass
    )[];
};

export class ObjectExpressionTypeClass extends LwcCommonTypeClass<'objectExpression'> {
    private readonly value: ObjectExpressionFields;

    private constructor(value: ObjectExpressionFields) {
        super('objectExpression');
        this.value = value;
    }

    static create(target: ObjectExpression, originalSource: string): ObjectExpressionTypeClass {
        return new ObjectExpressionTypeClass({
            properties: visitNodeList(
                target.properties,
                originalSource,
                objectExpressionPropertiesPairs(),
                'ObjectExpression.properties',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): ObjectExpressionFields {
        return this.value;
    }

    getProperties(): ObjectExpressionFields['properties'] {
        return this.value.properties;
    }
}

export const objectExpressionTypePair: EvaluatePair<ObjectExpression, ObjectExpressionTypeClass> =
    makeEvaluatePair(isObjectExpression, (target, originalSource) =>
        ObjectExpressionTypeClass.create(target, originalSource),
    );

export const isObjectExpressionType = (
    target: LwcCommonTypeClass<string>,
): target is ObjectExpressionTypeClass => target instanceof ObjectExpressionTypeClass;
