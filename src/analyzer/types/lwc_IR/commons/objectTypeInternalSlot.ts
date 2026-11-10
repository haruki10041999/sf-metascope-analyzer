import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isObjectTypeInternalSlot, type ObjectTypeInternalSlot } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    visitNode,
    getSourceSpan,
} from '../commonVisitor';
import { flowTypeVisitorEvaluatePairs, type FlowTypeTypeClass } from '../flowTypeVisitor';
import { IdentifierTypeClass } from './identifier';

export type ObjectTypeInternalSlotFields = TypeField<'objectTypeInternalSlot'> & {
    id: IdentifierTypeClass;
    value: FlowTypeTypeClass;
    optional: ObjectTypeInternalSlot['optional'];
    static: ObjectTypeInternalSlot['static'];
    method: ObjectTypeInternalSlot['method'];
};

export class ObjectTypeInternalSlotTypeClass extends LwcCommonTypeClass<
    'objectTypeInternalSlot',
    ObjectTypeInternalSlotFields
> {
    private constructor(value: FieldsOf<ObjectTypeInternalSlotFields>, sourceSpan: SourceSpan) {
        super('objectTypeInternalSlot', value, sourceSpan);
    }

    static create(
        target: ObjectTypeInternalSlot,
        originalSource: string,
    ): ObjectTypeInternalSlotTypeClass {
        return new ObjectTypeInternalSlotTypeClass(
            {
                id: IdentifierTypeClass.create(target.id, originalSource),
                value: visitNode(
                    target.value,
                    originalSource,
                    flowTypeVisitorEvaluatePairs(),
                    'FlowTypeVisitor',
                ),
                optional: target.optional,
                static: target.static,
                method: target.method,
            },
            getSourceSpan(target, originalSource),
        );
    }

    getId(): ObjectTypeInternalSlotFields['id'] {
        return this.getFields().id;
    }

    getValue(): ObjectTypeInternalSlotFields['value'] {
        return this.getFields().value;
    }

    getOptional(): ObjectTypeInternalSlotFields['optional'] {
        return this.getFields().optional;
    }

    getStatic(): ObjectTypeInternalSlotFields['static'] {
        return this.getFields().static;
    }

    getMethod(): ObjectTypeInternalSlotFields['method'] {
        return this.getFields().method;
    }
}

export const objectTypeInternalSlotTypePair: EvaluatePair<
    ObjectTypeInternalSlot,
    ObjectTypeInternalSlotTypeClass
> = makeEvaluatePair(isObjectTypeInternalSlot, (target, originalSource) =>
    ObjectTypeInternalSlotTypeClass.create(target, originalSource),
);

export const isObjectTypeInternalSlotType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is ObjectTypeInternalSlotTypeClass => target instanceof ObjectTypeInternalSlotTypeClass;
