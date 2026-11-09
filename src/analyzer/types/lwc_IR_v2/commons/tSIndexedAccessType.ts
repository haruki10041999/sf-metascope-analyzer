import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isTSIndexedAccessType, type TSIndexedAccessType } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    visitNode,
    getSourceSpan,
} from '../commonVisitor';
import { tSTypeVisitorEvaluatePairs, type TSTypeTypeClass } from '../tsTypeVisitor';

export type TSIndexedAccessTypeFields = TypeField<'tSIndexedAccessType'> & {
    objectType: TSTypeTypeClass;
    indexType: TSTypeTypeClass;
};

export class TSIndexedAccessTypeTypeClass extends LwcCommonTypeClass<
    'tSIndexedAccessType',
    TSIndexedAccessTypeFields
> {
    private constructor(value: FieldsOf<TSIndexedAccessTypeFields>, sourceSpan: SourceSpan) {
        super('tSIndexedAccessType', value, sourceSpan);
    }

    static create(
        target: TSIndexedAccessType,
        originalSource: string,
    ): TSIndexedAccessTypeTypeClass {
        return new TSIndexedAccessTypeTypeClass(
            {
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
            },
            getSourceSpan(target, originalSource),
        );
    }

    getObjectType(): TSIndexedAccessTypeFields['objectType'] {
        return this.getFields().objectType;
    }

    getIndexType(): TSIndexedAccessTypeFields['indexType'] {
        return this.getFields().indexType;
    }
}

export const tSIndexedAccessTypeTypePair: EvaluatePair<
    TSIndexedAccessType,
    TSIndexedAccessTypeTypeClass
> = makeEvaluatePair(isTSIndexedAccessType, (target, originalSource) =>
    TSIndexedAccessTypeTypeClass.create(target, originalSource),
);

export const isTSIndexedAccessTypeType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is TSIndexedAccessTypeTypeClass => target instanceof TSIndexedAccessTypeTypeClass;
