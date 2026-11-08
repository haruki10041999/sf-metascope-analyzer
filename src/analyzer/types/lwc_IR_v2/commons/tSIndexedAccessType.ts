import { isTSIndexedAccessType, type TSIndexedAccessType } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    makeEvaluatePair,
    visitNode,
} from '../commonVisitor';
import { tSTypeVisitorEvaluatePairs, type TSTypeTypeClass } from '../tsTypeVisitor';

export type TSIndexedAccessTypeFields = {
    objectType: TSTypeTypeClass | LwcErrorTypeClass;
    indexType: TSTypeTypeClass | LwcErrorTypeClass;
};

export class TSIndexedAccessTypeTypeClass extends LwcCommonTypeClass<'tSIndexedAccessType'> {
    private readonly value: TSIndexedAccessTypeFields;

    private constructor(value: TSIndexedAccessTypeFields) {
        super('tSIndexedAccessType');
        this.value = value;
    }

    static create(
        target: TSIndexedAccessType,
        originalSource: string,
    ): TSIndexedAccessTypeTypeClass {
        return new TSIndexedAccessTypeTypeClass({
            objectType: visitNode(
                target.objectType,
                originalSource,
                tSTypeVisitorEvaluatePairs(),
                'TSTypeVisitor',
            ),
            indexType: visitNode(
                target.indexType,
                originalSource,
                tSTypeVisitorEvaluatePairs(),
                'TSTypeVisitor',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): TSIndexedAccessTypeFields {
        return this.value;
    }

    getObjectType(): TSIndexedAccessTypeFields['objectType'] {
        return this.value.objectType;
    }

    getIndexType(): TSIndexedAccessTypeFields['indexType'] {
        return this.value.indexType;
    }
}

export const tSIndexedAccessTypeTypePair: EvaluatePair<
    TSIndexedAccessType,
    TSIndexedAccessTypeTypeClass
> = makeEvaluatePair(isTSIndexedAccessType, (target, originalSource) =>
    TSIndexedAccessTypeTypeClass.create(target, originalSource),
);

export const isTSIndexedAccessTypeType = (
    target: LwcCommonTypeClass<string>,
): target is TSIndexedAccessTypeTypeClass => target instanceof TSIndexedAccessTypeTypeClass;
