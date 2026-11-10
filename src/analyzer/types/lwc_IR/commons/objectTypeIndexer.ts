import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isObjectTypeIndexer, type ObjectTypeIndexer } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    visitNode,
    getSourceSpan,
} from '../commonVisitor';
import { flowTypeVisitorEvaluatePairs, type FlowTypeTypeClass } from '../flowTypeVisitor';
import { VarianceTypeClass } from '../flowVisitor/variance';
import { IdentifierTypeClass } from './identifier';

export type ObjectTypeIndexerFields = TypeField<'objectTypeIndexer'> & {
    id: IdentifierTypeClass | null;
    key: FlowTypeTypeClass;
    value: FlowTypeTypeClass;
    static: ObjectTypeIndexer['static'];
    variance: VarianceTypeClass | null;
};

export class ObjectTypeIndexerTypeClass extends LwcCommonTypeClass<
    'objectTypeIndexer',
    ObjectTypeIndexerFields
> {
    private constructor(value: FieldsOf<ObjectTypeIndexerFields>, sourceSpan: SourceSpan) {
        super('objectTypeIndexer', value, sourceSpan);
    }

    static create(target: ObjectTypeIndexer, originalSource: string): ObjectTypeIndexerTypeClass {
        return new ObjectTypeIndexerTypeClass(
            {
                id:
                    target.id == null
                        ? null
                        : IdentifierTypeClass.create(target.id, originalSource),
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
                variance:
                    target.variance == null
                        ? null
                        : VarianceTypeClass.create(target.variance, originalSource),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getId(): ObjectTypeIndexerFields['id'] {
        return this.getFields().id;
    }

    getKey(): ObjectTypeIndexerFields['key'] {
        return this.getFields().key;
    }

    getValue(): ObjectTypeIndexerFields['value'] {
        return this.getFields().value;
    }

    getStatic(): ObjectTypeIndexerFields['static'] {
        return this.getFields().static;
    }

    getVariance(): ObjectTypeIndexerFields['variance'] {
        return this.getFields().variance;
    }
}

export const objectTypeIndexerTypePair: EvaluatePair<
    ObjectTypeIndexer,
    ObjectTypeIndexerTypeClass
> = makeEvaluatePair(isObjectTypeIndexer, (target, originalSource) =>
    ObjectTypeIndexerTypeClass.create(target, originalSource),
);

export const isObjectTypeIndexerType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is ObjectTypeIndexerTypeClass => target instanceof ObjectTypeIndexerTypeClass;
