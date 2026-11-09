import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isTSUnionType, type TSUnionType } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    visitNodeList,
    getSourceSpan,
} from '../commonVisitor';
import { tSTypeVisitorEvaluatePairs, type TSTypeTypeClass } from '../tsTypeVisitor';

export type TSUnionTypeFields = TypeField<'tSUnionType'> & {
    types: TSTypeTypeClass[];
};

export class TSUnionTypeTypeClass extends LwcCommonTypeClass<'tSUnionType', TSUnionTypeFields> {
    private constructor(value: FieldsOf<TSUnionTypeFields>, sourceSpan: SourceSpan) {
        super('tSUnionType', value, sourceSpan);
    }

    static create(target: TSUnionType, originalSource: string): TSUnionTypeTypeClass {
        return new TSUnionTypeTypeClass(
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

    getTypes(): TSUnionTypeFields['types'] {
        return this.getFields().types;
    }
}

export const tSUnionTypeTypePair: EvaluatePair<TSUnionType, TSUnionTypeTypeClass> =
    makeEvaluatePair(isTSUnionType, (target, originalSource) =>
        TSUnionTypeTypeClass.create(target, originalSource),
    );

export const isTSUnionTypeType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is TSUnionTypeTypeClass => target instanceof TSUnionTypeTypeClass;
