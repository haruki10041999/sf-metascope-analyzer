import { isDeclaredPredicate, type DeclaredPredicate } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    makeEvaluatePair,
    visitNode,
} from '../commonVisitor';
import { expressionVisitorEvaluatePairs, type ExpressionTypeClass } from '../expressionVisitor';

export type DeclaredPredicateFields = {
    value: ExpressionTypeClass | LwcErrorTypeClass;
};

export class DeclaredPredicateTypeClass extends LwcCommonTypeClass<'declaredPredicate'> {
    private readonly value: DeclaredPredicateFields;

    private constructor(value: DeclaredPredicateFields) {
        super('declaredPredicate');
        this.value = value;
    }

    static create(target: DeclaredPredicate, originalSource: string): DeclaredPredicateTypeClass {
        return new DeclaredPredicateTypeClass({
            value: visitNode(
                target.value,
                originalSource,
                expressionVisitorEvaluatePairs(),
                'ExpressionVisitor',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): DeclaredPredicateFields {
        return this.value;
    }

    getValue(): DeclaredPredicateFields['value'] {
        return this.value.value;
    }
}

export const declaredPredicateTypePair: EvaluatePair<
    DeclaredPredicate,
    DeclaredPredicateTypeClass
> = makeEvaluatePair(isDeclaredPredicate, (target, originalSource) =>
    DeclaredPredicateTypeClass.create(target, originalSource),
);

export const isDeclaredPredicateType = (
    target: LwcCommonTypeClass<string>,
): target is DeclaredPredicateTypeClass => target instanceof DeclaredPredicateTypeClass;
