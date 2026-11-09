import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isObjectTypeSpreadProperty, type ObjectTypeSpreadProperty } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    visitNode,
    getSourceSpan,
} from '../commonVisitor';
import { flowTypeVisitorEvaluatePairs, type FlowTypeTypeClass } from '../flowTypeVisitor';

export type ObjectTypeSpreadPropertyFields = TypeField<'objectTypeSpreadProperty'> & {
    argument: FlowTypeTypeClass;
};

export class ObjectTypeSpreadPropertyTypeClass extends LwcCommonTypeClass<
    'objectTypeSpreadProperty',
    ObjectTypeSpreadPropertyFields
> {
    private constructor(value: FieldsOf<ObjectTypeSpreadPropertyFields>, sourceSpan: SourceSpan) {
        super('objectTypeSpreadProperty', value, sourceSpan);
    }

    static create(
        target: ObjectTypeSpreadProperty,
        originalSource: string,
    ): ObjectTypeSpreadPropertyTypeClass {
        return new ObjectTypeSpreadPropertyTypeClass(
            {
                argument: visitNode(
                    target.argument,
                    originalSource,
                    flowTypeVisitorEvaluatePairs(),
                    'FlowTypeVisitor',
                ),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getArgument(): ObjectTypeSpreadPropertyFields['argument'] {
        return this.getFields().argument;
    }
}

export const objectTypeSpreadPropertyTypePair: EvaluatePair<
    ObjectTypeSpreadProperty,
    ObjectTypeSpreadPropertyTypeClass
> = makeEvaluatePair(isObjectTypeSpreadProperty, (target, originalSource) =>
    ObjectTypeSpreadPropertyTypeClass.create(target, originalSource),
);

export const isObjectTypeSpreadPropertyType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is ObjectTypeSpreadPropertyTypeClass =>
    target instanceof ObjectTypeSpreadPropertyTypeClass;
