import { isStringLiteral, type StringLiteral } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export type StringLiteralFields = {
    value: StringLiteral['value'];
};

export class StringLiteralTypeClass extends LwcCommonTypeClass<'stringLiteral'> {
    private readonly value: StringLiteralFields;

    private constructor(value: StringLiteralFields) {
        super('stringLiteral');
        this.value = value;
    }

    static create(target: StringLiteral, originalSource: string): StringLiteralTypeClass {
        return new StringLiteralTypeClass({
            value: target.value,
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): StringLiteralFields {
        return this.value;
    }

    getValue(): StringLiteralFields['value'] {
        return this.value.value;
    }
}

export const stringLiteralTypePair: EvaluatePair<StringLiteral, StringLiteralTypeClass> =
    makeEvaluatePair(isStringLiteral, (target, originalSource) =>
        StringLiteralTypeClass.create(target, originalSource),
    );

export const isStringLiteralType = (
    target: LwcCommonTypeClass<string>,
): target is StringLiteralTypeClass => target instanceof StringLiteralTypeClass;
