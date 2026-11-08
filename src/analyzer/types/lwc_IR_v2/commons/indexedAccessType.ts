import { isIndexedAccessType, type IndexedAccessType } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    makeEvaluatePair,
    visitNode,
} from '../commonVisitor';
import { flowTypeVisitorEvaluatePairs, type FlowTypeTypeClass } from '../flowTypeVisitor';

export type IndexedAccessTypeFields = {
    objectType: FlowTypeTypeClass | LwcErrorTypeClass;
    indexType: FlowTypeTypeClass | LwcErrorTypeClass;
};

export class IndexedAccessTypeTypeClass extends LwcCommonTypeClass<'indexedAccessType'> {
    private readonly value: IndexedAccessTypeFields;

    private constructor(value: IndexedAccessTypeFields) {
        super('indexedAccessType');
        this.value = value;
    }

    static create(target: IndexedAccessType, originalSource: string): IndexedAccessTypeTypeClass {
        return new IndexedAccessTypeTypeClass({
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
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): IndexedAccessTypeFields {
        return this.value;
    }

    getObjectType(): IndexedAccessTypeFields['objectType'] {
        return this.value.objectType;
    }

    getIndexType(): IndexedAccessTypeFields['indexType'] {
        return this.value.indexType;
    }
}

export const indexedAccessTypeTypePair: EvaluatePair<
    IndexedAccessType,
    IndexedAccessTypeTypeClass
> = makeEvaluatePair(isIndexedAccessType, (target, originalSource) =>
    IndexedAccessTypeTypeClass.create(target, originalSource),
);

export const isIndexedAccessTypeType = (
    target: LwcCommonTypeClass<string>,
): target is IndexedAccessTypeTypeClass => target instanceof IndexedAccessTypeTypeClass;
