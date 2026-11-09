import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isNumericLiteral, type NumericLiteral } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    getSourceSpan,
} from '../commonVisitor';

export type NumericLiteralFields = TypeField<'numericLiteral'> & {
    value: NumericLiteral['value'];
};

export class NumericLiteralTypeClass extends LwcCommonTypeClass<
    'numericLiteral',
    NumericLiteralFields
> {
    private constructor(value: FieldsOf<NumericLiteralFields>, sourceSpan: SourceSpan) {
        super('numericLiteral', value, sourceSpan);
    }

    static create(target: NumericLiteral, originalSource: string): NumericLiteralTypeClass {
        return new NumericLiteralTypeClass(
            {
                value: target.value,
            },
            getSourceSpan(target, originalSource),
        );
    }

    getValue(): NumericLiteralFields['value'] {
        return this.getFields().value;
    }
}

export const numericLiteralTypePair: EvaluatePair<NumericLiteral, NumericLiteralTypeClass> =
    makeEvaluatePair(isNumericLiteral, (target, originalSource) =>
        NumericLiteralTypeClass.create(target, originalSource),
    );

export const isNumericLiteralType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is NumericLiteralTypeClass => target instanceof NumericLiteralTypeClass;
