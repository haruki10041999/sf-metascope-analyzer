import { isObjectTypeIndexer, type ObjectTypeIndexer } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
    visitOptionalNode,
} from '../commonVisitor';
import { flowTypeVisitorEvaluatePairs, type FlowTypeTypeClass } from '../flowTypeVisitor';
import { varianceTypePair, type VarianceTypeClass } from '../flowVisitor/variance';
import { identifierTypePair, type IdentifierTypeClass } from './identifier';

const objectTypeIndexerIdPairs = lazyPairs(() => [identifierTypePair] as const);
const objectTypeIndexerVariancePairs = lazyPairs(() => [varianceTypePair] as const);

export type ObjectTypeIndexerFields = {
    id: IdentifierTypeClass | LwcErrorTypeClass | null;
    key: FlowTypeTypeClass | LwcErrorTypeClass;
    value: FlowTypeTypeClass | LwcErrorTypeClass;
    static: ObjectTypeIndexer['static'];
    variance: VarianceTypeClass | LwcErrorTypeClass | null;
};

export class ObjectTypeIndexerTypeClass extends LwcCommonTypeClass<'objectTypeIndexer'> {
    private readonly value: ObjectTypeIndexerFields;

    private constructor(value: ObjectTypeIndexerFields) {
        super('objectTypeIndexer');
        this.value = value;
    }

    static create(target: ObjectTypeIndexer, originalSource: string): ObjectTypeIndexerTypeClass {
        return new ObjectTypeIndexerTypeClass({
            id: visitOptionalNode(
                target.id,
                originalSource,
                objectTypeIndexerIdPairs(),
                'ObjectTypeIndexer.id',
            ),
            key: visitNode(
                target.key,
                originalSource,
                flowTypeVisitorEvaluatePairs(),
                'FlowTypeVisitor',
            ),
            value: visitNode(
                target.value,
                originalSource,
                flowTypeVisitorEvaluatePairs(),
                'FlowTypeVisitor',
            ),
            static: target.static,
            variance: visitOptionalNode(
                target.variance,
                originalSource,
                objectTypeIndexerVariancePairs(),
                'ObjectTypeIndexer.variance',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): ObjectTypeIndexerFields {
        return this.value;
    }

    getId(): ObjectTypeIndexerFields['id'] {
        return this.value.id;
    }

    getKey(): ObjectTypeIndexerFields['key'] {
        return this.value.key;
    }

    getValue(): ObjectTypeIndexerFields['value'] {
        return this.value.value;
    }

    getStatic(): ObjectTypeIndexerFields['static'] {
        return this.value.static;
    }

    getVariance(): ObjectTypeIndexerFields['variance'] {
        return this.value.variance;
    }
}

export const objectTypeIndexerTypePair: EvaluatePair<
    ObjectTypeIndexer,
    ObjectTypeIndexerTypeClass
> = makeEvaluatePair(isObjectTypeIndexer, (target, originalSource) =>
    ObjectTypeIndexerTypeClass.create(target, originalSource),
);

export const isObjectTypeIndexerType = (
    target: LwcCommonTypeClass<string>,
): target is ObjectTypeIndexerTypeClass => target instanceof ObjectTypeIndexerTypeClass;
