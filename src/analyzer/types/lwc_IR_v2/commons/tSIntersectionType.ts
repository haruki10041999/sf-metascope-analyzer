import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isTSIntersectionType, type TSIntersectionType } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    visitNodeList,
    getSourceSpan,
} from '../commonVisitor';
import { tSTypeVisitorEvaluatePairs, type TSTypeTypeClass } from '../tsTypeVisitor';

export type TSIntersectionTypeFields = TypeField<'tSIntersectionType'> & {
    types: TSTypeTypeClass[];
};

export class TSIntersectionTypeTypeClass extends LwcCommonTypeClass<
    'tSIntersectionType',
    TSIntersectionTypeFields
> {
    private constructor(value: FieldsOf<TSIntersectionTypeFields>, sourceSpan: SourceSpan) {
        super('tSIntersectionType', value, sourceSpan);
    }

    static create(target: TSIntersectionType, originalSource: string): TSIntersectionTypeTypeClass {
        return new TSIntersectionTypeTypeClass(
            {
                types: visitNodeList(
                    target.types,
                    originalSource,
                    tSTypeVisitorEvaluatePairs(),
                    'TSTypeVisitor',
                ),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getTypes(): TSIntersectionTypeFields['types'] {
        return this.getFields().types;
    }
}

export const tSIntersectionTypeTypePair: EvaluatePair<
    TSIntersectionType,
    TSIntersectionTypeTypeClass
> = makeEvaluatePair(isTSIntersectionType, (target, originalSource) =>
    TSIntersectionTypeTypeClass.create(target, originalSource),
);

export const isTSIntersectionTypeType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is TSIntersectionTypeTypeClass => target instanceof TSIntersectionTypeTypeClass;
