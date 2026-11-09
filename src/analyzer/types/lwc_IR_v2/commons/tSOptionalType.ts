import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isTSOptionalType, type TSOptionalType } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    visitNode,
    getSourceSpan,
} from '../commonVisitor';
import { tSTypeVisitorEvaluatePairs, type TSTypeTypeClass } from '../tsTypeVisitor';

export type TSOptionalTypeFields = TypeField<'tSOptionalType'> & {
    typeAnnotation: TSTypeTypeClass;
};

export class TSOptionalTypeTypeClass extends LwcCommonTypeClass<
    'tSOptionalType',
    TSOptionalTypeFields
> {
    private constructor(value: FieldsOf<TSOptionalTypeFields>, sourceSpan: SourceSpan) {
        super('tSOptionalType', value, sourceSpan);
    }

    static create(target: TSOptionalType, originalSource: string): TSOptionalTypeTypeClass {
        return new TSOptionalTypeTypeClass(
            {
                typeAnnotation: visitNode(
                    target.typeAnnotation,
                    originalSource,
                    tSTypeVisitorEvaluatePairs(),
                    'TSTypeVisitor',
                ),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getTypeAnnotation(): TSOptionalTypeFields['typeAnnotation'] {
        return this.getFields().typeAnnotation;
    }
}

export const tSOptionalTypeTypePair: EvaluatePair<TSOptionalType, TSOptionalTypeTypeClass> =
    makeEvaluatePair(isTSOptionalType, (target, originalSource) =>
        TSOptionalTypeTypeClass.create(target, originalSource),
    );

export const isTSOptionalTypeType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is TSOptionalTypeTypeClass => target instanceof TSOptionalTypeTypeClass;
