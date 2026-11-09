import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isTSTypeAssertion, type TSTypeAssertion } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    visitNode,
    getSourceSpan,
} from '../commonVisitor';
import { expressionVisitorEvaluatePairs, type ExpressionTypeClass } from '../expressionVisitor';
import { tSTypeVisitorEvaluatePairs, type TSTypeTypeClass } from '../tsTypeVisitor';

export type TSTypeAssertionFields = TypeField<'tSTypeAssertion'> & {
    typeAnnotation: TSTypeTypeClass;
    expression: ExpressionTypeClass;
};

export class TSTypeAssertionTypeClass extends LwcCommonTypeClass<
    'tSTypeAssertion',
    TSTypeAssertionFields
> {
    private constructor(value: FieldsOf<TSTypeAssertionFields>, sourceSpan: SourceSpan) {
        super('tSTypeAssertion', value, sourceSpan);
    }

    static create(target: TSTypeAssertion, originalSource: string): TSTypeAssertionTypeClass {
        return new TSTypeAssertionTypeClass(
            {
                typeAnnotation: visitNode(
                    target.typeAnnotation,
                    originalSource,
                    tSTypeVisitorEvaluatePairs(),
                    'TSTypeVisitor',
                ),
                expression: visitNode(
                    target.expression,
                    originalSource,
                    expressionVisitorEvaluatePairs(),
                    'ExpressionVisitor',
                ),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getTypeAnnotation(): TSTypeAssertionFields['typeAnnotation'] {
        return this.getFields().typeAnnotation;
    }

    getExpression(): TSTypeAssertionFields['expression'] {
        return this.getFields().expression;
    }
}

export const tSTypeAssertionTypePair: EvaluatePair<TSTypeAssertion, TSTypeAssertionTypeClass> =
    makeEvaluatePair(isTSTypeAssertion, (target, originalSource) =>
        TSTypeAssertionTypeClass.create(target, originalSource),
    );

export const isTSTypeAssertionType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is TSTypeAssertionTypeClass => target instanceof TSTypeAssertionTypeClass;
