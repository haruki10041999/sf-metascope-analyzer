import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isIndexedAccessType, type IndexedAccessType } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    visitNode,
    getSourceSpan,
} from '../commonVisitor';
import { flowTypeVisitorEvaluatePairs, type FlowTypeTypeClass } from '../flowTypeVisitor';

export type IndexedAccessTypeFields = TypeField<'indexedAccessType'> & {
    objectType: FlowTypeTypeClass;
    indexType: FlowTypeTypeClass;
};

export class IndexedAccessTypeTypeClass extends LwcCommonTypeClass<
    'indexedAccessType',
    IndexedAccessTypeFields
> {
    private constructor(value: FieldsOf<IndexedAccessTypeFields>, sourceSpan: SourceSpan) {
        super('indexedAccessType', value, sourceSpan);
    }

    static create(target: IndexedAccessType, originalSource: string): IndexedAccessTypeTypeClass {
        return new IndexedAccessTypeTypeClass(
            {
                objectType: visitNode(
                    target.objectType,
                    originalSource,
                    flowTypeVisitorEvaluatePairs(),
                    'FlowTypeVisitor',
                ),
                indexType: visitNode(
                    target.indexType,
                    originalSource,
                    flowTypeVisitorEvaluatePairs(),
                    'FlowTypeVisitor',
                ),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getObjectType(): IndexedAccessTypeFields['objectType'] {
        return this.getFields().objectType;
    }

    getIndexType(): IndexedAccessTypeFields['indexType'] {
        return this.getFields().indexType;
    }
}

export const indexedAccessTypeTypePair: EvaluatePair<
    IndexedAccessType,
    IndexedAccessTypeTypeClass
> = makeEvaluatePair(isIndexedAccessType, (target, originalSource) =>
    IndexedAccessTypeTypeClass.create(target, originalSource),
);

export const isIndexedAccessTypeType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is IndexedAccessTypeTypeClass => target instanceof IndexedAccessTypeTypeClass;
