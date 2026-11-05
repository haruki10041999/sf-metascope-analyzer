import { isNumberLiteral, type Node, type NumberLiteral } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

// 非推奨の別名。Babel 8 の parse は作らず NumericLiteral を使う。isNumberLiteral は型の判定 (target is ...) にならないので包む
const isNumberLiteralNode = (target: Node | null | undefined): target is NumberLiteral =>
    isNumberLiteral(target);

export type NumberLiteralFields = {
    value: NumberLiteral['value'];
};

export class NumberLiteralTypeClass extends LwcCommonTypeClass<'numberLiteral'> {
    private readonly value: NumberLiteralFields;

    private constructor(value: NumberLiteralFields) {
        super('numberLiteral');
        this.value = value;
    }

    static create(target: NumberLiteral, originalSource: string): NumberLiteralTypeClass {
        return new NumberLiteralTypeClass({
            value: target.value,
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): NumberLiteralFields {
        return this.value;
    }

    getValue(): NumberLiteralFields['value'] {
        return this.value.value;
    }
}

export const numberLiteralTypePair: EvaluatePair<NumberLiteral, NumberLiteralTypeClass> =
    makeEvaluatePair(isNumberLiteralNode, (target, originalSource) =>
        NumberLiteralTypeClass.create(target, originalSource),
    );

export const isNumberLiteralType = (
    target: LwcCommonTypeClass<string>,
): target is NumberLiteralTypeClass => target instanceof NumberLiteralTypeClass;
