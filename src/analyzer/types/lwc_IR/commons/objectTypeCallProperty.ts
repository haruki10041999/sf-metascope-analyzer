import { isObjectTypeCallProperty, type ObjectTypeCallProperty } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    makeEvaluatePair,
    visitNode,
} from '../commonVisitor';
import { flowTypeVisitorEvaluatePairs, type FlowTypeTypeClass } from '../flowTypeVisitor';

export type ObjectTypeCallPropertyFields = {
    value: FlowTypeTypeClass | LwcErrorTypeClass;
    static: ObjectTypeCallProperty['static'];
};

export class ObjectTypeCallPropertyTypeClass extends LwcCommonTypeClass<'objectTypeCallProperty'> {
    private readonly value: ObjectTypeCallPropertyFields;

    private constructor(value: ObjectTypeCallPropertyFields) {
        super('objectTypeCallProperty');
        this.value = value;
    }

    static create(
        target: ObjectTypeCallProperty,
        originalSource: string,
    ): ObjectTypeCallPropertyTypeClass {
        return new ObjectTypeCallPropertyTypeClass({
            value: visitNode(
                target.value,
                originalSource,
                flowTypeVisitorEvaluatePairs(),
                'FlowTypeVisitor',
            ),
            static: target.static,
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): ObjectTypeCallPropertyFields {
        return this.value;
    }

    getValue(): ObjectTypeCallPropertyFields['value'] {
        return this.value.value;
    }

    getStatic(): ObjectTypeCallPropertyFields['static'] {
        return this.value.static;
    }
}

export const objectTypeCallPropertyTypePair: EvaluatePair<
    ObjectTypeCallProperty,
    ObjectTypeCallPropertyTypeClass
> = makeEvaluatePair(isObjectTypeCallProperty, (target, originalSource) =>
    ObjectTypeCallPropertyTypeClass.create(target, originalSource),
);

export const isObjectTypeCallPropertyType = (
    target: LwcCommonTypeClass<string>,
): target is ObjectTypeCallPropertyTypeClass => target instanceof ObjectTypeCallPropertyTypeClass;
