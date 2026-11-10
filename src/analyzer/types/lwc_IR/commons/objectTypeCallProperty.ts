import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isObjectTypeCallProperty, type ObjectTypeCallProperty } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    visitNode,
    getSourceSpan,
} from '../commonVisitor';
import { flowTypeVisitorEvaluatePairs, type FlowTypeTypeClass } from '../flowTypeVisitor';

export type ObjectTypeCallPropertyFields = TypeField<'objectTypeCallProperty'> & {
    value: FlowTypeTypeClass;
    static: ObjectTypeCallProperty['static'];
};

export class ObjectTypeCallPropertyTypeClass extends LwcCommonTypeClass<
    'objectTypeCallProperty',
    ObjectTypeCallPropertyFields
> {
    private constructor(value: FieldsOf<ObjectTypeCallPropertyFields>, sourceSpan: SourceSpan) {
        super('objectTypeCallProperty', value, sourceSpan);
    }

    static create(
        target: ObjectTypeCallProperty,
        originalSource: string,
    ): ObjectTypeCallPropertyTypeClass {
        return new ObjectTypeCallPropertyTypeClass(
            {
                value: visitNode(
                    target.value,
                    originalSource,
                    flowTypeVisitorEvaluatePairs(),
                    'FlowTypeVisitor',
                ),
                static: target.static,
            },
            getSourceSpan(target, originalSource),
        );
    }

    getValue(): ObjectTypeCallPropertyFields['value'] {
        return this.getFields().value;
    }

    getStatic(): ObjectTypeCallPropertyFields['static'] {
        return this.getFields().static;
    }
}

export const objectTypeCallPropertyTypePair: EvaluatePair<
    ObjectTypeCallProperty,
    ObjectTypeCallPropertyTypeClass
> = makeEvaluatePair(isObjectTypeCallProperty, (target, originalSource) =>
    ObjectTypeCallPropertyTypeClass.create(target, originalSource),
);

export const isObjectTypeCallPropertyType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is ObjectTypeCallPropertyTypeClass => target instanceof ObjectTypeCallPropertyTypeClass;
