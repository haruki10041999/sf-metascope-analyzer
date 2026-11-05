import { isObjectTypeInternalSlot, type ObjectTypeInternalSlot } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
} from '../commonVisitor';
import { flowTypeVisitorEvaluatePairs, type FlowTypeTypeClass } from '../flowTypeVisitor';
import { identifierTypePair, type IdentifierTypeClass } from './identifier';

const objectTypeInternalSlotIdPairs = lazyPairs(() => [identifierTypePair] as const);

export type ObjectTypeInternalSlotFields = {
    id: IdentifierTypeClass | LwcErrorTypeClass;
    value: FlowTypeTypeClass | LwcErrorTypeClass;
    optional: ObjectTypeInternalSlot['optional'];
    static: ObjectTypeInternalSlot['static'];
    method: ObjectTypeInternalSlot['method'];
};

export class ObjectTypeInternalSlotTypeClass extends LwcCommonTypeClass<'objectTypeInternalSlot'> {
    private readonly value: ObjectTypeInternalSlotFields;

    private constructor(value: ObjectTypeInternalSlotFields) {
        super('objectTypeInternalSlot');
        this.value = value;
    }

    static create(
        target: ObjectTypeInternalSlot,
        originalSource: string,
    ): ObjectTypeInternalSlotTypeClass {
        return new ObjectTypeInternalSlotTypeClass({
            id: visitNode(
                target.id,
                originalSource,
                objectTypeInternalSlotIdPairs(),
                'ObjectTypeInternalSlot.id',
            ),
            value: visitNode(
                target.value,
                originalSource,
                flowTypeVisitorEvaluatePairs(),
                'FlowTypeVisitor',
            ),
            optional: target.optional,
            static: target.static,
            method: target.method,
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): ObjectTypeInternalSlotFields {
        return this.value;
    }

    getId(): ObjectTypeInternalSlotFields['id'] {
        return this.value.id;
    }

    getValue(): ObjectTypeInternalSlotFields['value'] {
        return this.value.value;
    }

    getOptional(): ObjectTypeInternalSlotFields['optional'] {
        return this.value.optional;
    }

    getStatic(): ObjectTypeInternalSlotFields['static'] {
        return this.value.static;
    }

    getMethod(): ObjectTypeInternalSlotFields['method'] {
        return this.value.method;
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
