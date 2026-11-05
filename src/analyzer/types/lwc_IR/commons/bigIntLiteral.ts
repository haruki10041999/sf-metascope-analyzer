import { isBigIntLiteral, type BigIntLiteral } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export type BigIntLiteralFields = {
    value: BigIntLiteral['value'];
};

export class BigIntLiteralTypeClass extends LwcCommonTypeClass<'bigIntLiteral'> {
    private readonly value: BigIntLiteralFields;

    private constructor(value: BigIntLiteralFields) {
        super('bigIntLiteral');
        this.value = value;
    }

    static create(target: BigIntLiteral, originalSource: string): BigIntLiteralTypeClass {
        return new BigIntLiteralTypeClass({
            value: target.value,
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): BigIntLiteralFields {
        return this.value;
    }

    getValue(): BigIntLiteralFields['value'] {
        return this.value.value;
    }
}

export const bigIntLiteralTypePair: EvaluatePair<BigIntLiteral, BigIntLiteralTypeClass> =
    makeEvaluatePair(isBigIntLiteral, (target, originalSource) =>
        BigIntLiteralTypeClass.create(target, originalSource),
    );

export const isBigIntLiteralType = (
    target: LwcCommonTypeClass<string>,
): target is BigIntLiteralTypeClass => target instanceof BigIntLiteralTypeClass;
