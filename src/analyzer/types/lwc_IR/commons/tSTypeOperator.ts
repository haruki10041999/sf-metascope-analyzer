import { isTSTypeOperator, type TSTypeOperator } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    makeEvaluatePair,
    visitNode,
} from '../commonVisitor';
import { tSTypeVisitorEvaluatePairs, type TSTypeTypeClass } from '../tsTypeVisitor';

export type TSTypeOperatorFields = {
    operator: TSTypeOperator['operator'];
    typeAnnotation: TSTypeTypeClass | LwcErrorTypeClass;
};

export class TSTypeOperatorTypeClass extends LwcCommonTypeClass<'tSTypeOperator'> {
    private readonly value: TSTypeOperatorFields;

    private constructor(value: TSTypeOperatorFields) {
        super('tSTypeOperator');
        this.value = value;
    }

    static create(target: TSTypeOperator, originalSource: string): TSTypeOperatorTypeClass {
        return new TSTypeOperatorTypeClass({
            operator: target.operator,
            typeAnnotation: visitNode(
                target.typeAnnotation,
                originalSource,
                tSTypeVisitorEvaluatePairs(),
                'TSTypeVisitor',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): TSTypeOperatorFields {
        return this.value;
    }

    getOperator(): TSTypeOperatorFields['operator'] {
        return this.value.operator;
    }

    getTypeAnnotation(): TSTypeOperatorFields['typeAnnotation'] {
        return this.value.typeAnnotation;
    }
}

export const tSTypeOperatorTypePair: EvaluatePair<TSTypeOperator, TSTypeOperatorTypeClass> =
    makeEvaluatePair(isTSTypeOperator, (target, originalSource) =>
        TSTypeOperatorTypeClass.create(target, originalSource),
    );

export const isTSTypeOperatorType = (
    target: LwcCommonTypeClass<string>,
): target is TSTypeOperatorTypeClass => target instanceof TSTypeOperatorTypeClass;
