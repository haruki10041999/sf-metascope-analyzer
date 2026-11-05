import { isBooleanLiteral, type BooleanLiteral } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export type BooleanLiteralFields = {
    value: BooleanLiteral['value'];
};

export class BooleanLiteralTypeClass extends LwcCommonTypeClass<'booleanLiteral'> {
    private readonly value: BooleanLiteralFields;

    private constructor(value: BooleanLiteralFields) {
        super('booleanLiteral');
        this.value = value;
    }

    static create(target: BooleanLiteral, originalSource: string): BooleanLiteralTypeClass {
        return new BooleanLiteralTypeClass({
            value: target.value,
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): BooleanLiteralFields {
        return this.value;
    }

    getValue(): BooleanLiteralFields['value'] {
        return this.value.value;
    }
}

export const booleanLiteralTypePair: EvaluatePair<BooleanLiteral, BooleanLiteralTypeClass> =
    makeEvaluatePair(isBooleanLiteral, (target, originalSource) =>
        BooleanLiteralTypeClass.create(target, originalSource),
    );

export const isBooleanLiteralType = (
    target: LwcCommonTypeClass<string>,
): target is BooleanLiteralTypeClass => target instanceof BooleanLiteralTypeClass;
