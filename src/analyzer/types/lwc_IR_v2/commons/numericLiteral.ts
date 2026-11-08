import { isNumericLiteral, type NumericLiteral } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export type NumericLiteralFields = {
    value: NumericLiteral['value'];
};

export class NumericLiteralTypeClass extends LwcCommonTypeClass<'numericLiteral'> {
    private readonly value: NumericLiteralFields;

    private constructor(value: NumericLiteralFields) {
        super('numericLiteral');
        this.value = value;
    }

    static create(target: NumericLiteral, originalSource: string): NumericLiteralTypeClass {
        return new NumericLiteralTypeClass({
            value: target.value,
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): NumericLiteralFields {
        return this.value;
    }

    getValue(): NumericLiteralFields['value'] {
        return this.value.value;
    }
}

export const numericLiteralTypePair: EvaluatePair<NumericLiteral, NumericLiteralTypeClass> =
    makeEvaluatePair(isNumericLiteral, (target, originalSource) =>
        NumericLiteralTypeClass.create(target, originalSource),
    );

export const isNumericLiteralType = (
    target: LwcCommonTypeClass<string>,
): target is NumericLiteralTypeClass => target instanceof NumericLiteralTypeClass;
