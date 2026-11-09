import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isTSTypeOperator, type TSTypeOperator } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    visitNode,
    getSourceSpan,
} from '../commonVisitor';
import { tSTypeVisitorEvaluatePairs, type TSTypeTypeClass } from '../tsTypeVisitor';

export type TSTypeOperatorFields = TypeField<'tSTypeOperator'> & {
    operator: TSTypeOperator['operator'];
    typeAnnotation: TSTypeTypeClass;
};

export class TSTypeOperatorTypeClass extends LwcCommonTypeClass<
    'tSTypeOperator',
    TSTypeOperatorFields
> {
    private constructor(value: FieldsOf<TSTypeOperatorFields>, sourceSpan: SourceSpan) {
        super('tSTypeOperator', value, sourceSpan);
    }

    static create(target: TSTypeOperator, originalSource: string): TSTypeOperatorTypeClass {
        return new TSTypeOperatorTypeClass(
            {
                operator: target.operator,
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

    getOperator(): TSTypeOperatorFields['operator'] {
        return this.getFields().operator;
    }

    getTypeAnnotation(): TSTypeOperatorFields['typeAnnotation'] {
        return this.getFields().typeAnnotation;
    }
}

export const tSTypeOperatorTypePair: EvaluatePair<TSTypeOperator, TSTypeOperatorTypeClass> =
    makeEvaluatePair(isTSTypeOperator, (target, originalSource) =>
        TSTypeOperatorTypeClass.create(target, originalSource),
    );

export const isTSTypeOperatorType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is TSTypeOperatorTypeClass => target instanceof TSTypeOperatorTypeClass;
