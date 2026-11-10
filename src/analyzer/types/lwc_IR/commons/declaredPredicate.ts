import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isDeclaredPredicate, type DeclaredPredicate } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    visitNode,
    getSourceSpan,
} from '../commonVisitor';
import { expressionVisitorEvaluatePairs, type ExpressionTypeClass } from '../expressionVisitor';

export type DeclaredPredicateFields = TypeField<'declaredPredicate'> & {
    value: ExpressionTypeClass;
};

export class DeclaredPredicateTypeClass extends LwcCommonTypeClass<
    'declaredPredicate',
    DeclaredPredicateFields
> {
    private constructor(value: FieldsOf<DeclaredPredicateFields>, sourceSpan: SourceSpan) {
        super('declaredPredicate', value, sourceSpan);
    }

    static create(target: DeclaredPredicate, originalSource: string): DeclaredPredicateTypeClass {
        return new DeclaredPredicateTypeClass(
            {
                value: visitNode(
                    target.value,
                    originalSource,
                    expressionVisitorEvaluatePairs(),
                    'ExpressionVisitor',
                ),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getValue(): DeclaredPredicateFields['value'] {
        return this.getFields().value;
    }
}

export const declaredPredicateTypePair: EvaluatePair<
    DeclaredPredicate,
    DeclaredPredicateTypeClass
> = makeEvaluatePair(isDeclaredPredicate, (target, originalSource) =>
    DeclaredPredicateTypeClass.create(target, originalSource),
);

export const isDeclaredPredicateType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is DeclaredPredicateTypeClass => target instanceof DeclaredPredicateTypeClass;
