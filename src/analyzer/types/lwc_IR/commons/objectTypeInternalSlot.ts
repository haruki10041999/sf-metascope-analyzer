import { isObjectTypeInternalSlot, type ObjectTypeInternalSlot } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class ObjectTypeInternalSlotTypeClass extends LwcCommonTypeClass<'objectTypeInternalSlot'> {
    private constructor(originalSource: string) {
        super('objectTypeInternalSlot', originalSource);
    }

    static create(
        target: ObjectTypeInternalSlot,
        originalSource: string,
    ): ObjectTypeInternalSlotTypeClass {
        throw new Error(
            'ObjectTypeInternalSlotTypeClass.create is not implemented: ' + target.type,
        );
    }
}

export const objectTypeInternalSlotTypePair: EvaluatePair<
    ObjectTypeInternalSlot,
    ObjectTypeInternalSlotTypeClass
> = makeEvaluatePair(isObjectTypeInternalSlot, (target, originalSource) =>
    ObjectTypeInternalSlotTypeClass.create(target, originalSource),
);

export const isObjectTypeInternalSlotType = (
    target: LwcCommonTypeClass<string>,
): target is ObjectTypeInternalSlotTypeClass => target instanceof ObjectTypeInternalSlotTypeClass;
