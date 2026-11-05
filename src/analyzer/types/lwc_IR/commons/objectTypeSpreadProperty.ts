import { isObjectTypeSpreadProperty, type ObjectTypeSpreadProperty } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    makeEvaluatePair,
    visitNode,
} from '../commonVisitor';
import { flowTypeVisitorEvaluatePairs, type FlowTypeTypeClass } from '../flowTypeVisitor';

export type ObjectTypeSpreadPropertyFields = {
    argument: FlowTypeTypeClass | LwcErrorTypeClass;
};

export class ObjectTypeSpreadPropertyTypeClass extends LwcCommonTypeClass<'objectTypeSpreadProperty'> {
    private readonly value: ObjectTypeSpreadPropertyFields;

    private constructor(value: ObjectTypeSpreadPropertyFields) {
        super('objectTypeSpreadProperty');
        this.value = value;
    }

    static create(
        target: ObjectTypeSpreadProperty,
        originalSource: string,
    ): ObjectTypeSpreadPropertyTypeClass {
        return new ObjectTypeSpreadPropertyTypeClass({
            argument: visitNode(
                target.argument,
                originalSource,
                flowTypeVisitorEvaluatePairs(),
                'FlowTypeVisitor',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): ObjectTypeSpreadPropertyFields {
        return this.value;
    }

    getArgument(): ObjectTypeSpreadPropertyFields['argument'] {
        return this.value.argument;
    }
}

export const objectTypeSpreadPropertyTypePair: EvaluatePair<
    ObjectTypeSpreadProperty,
    ObjectTypeSpreadPropertyTypeClass
> = makeEvaluatePair(isObjectTypeSpreadProperty, (target, originalSource) =>
    ObjectTypeSpreadPropertyTypeClass.create(target, originalSource),
);

export const isObjectTypeSpreadPropertyType = (
    target: LwcCommonTypeClass<string>,
): target is ObjectTypeSpreadPropertyTypeClass =>
    target instanceof ObjectTypeSpreadPropertyTypeClass;
