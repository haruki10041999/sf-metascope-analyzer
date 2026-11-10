import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isBigIntLiteral, type BigIntLiteral } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    getSourceSpan,
} from '../commonVisitor';

export type BigIntLiteralFields = TypeField<'bigIntLiteral'> & {
    value: BigIntLiteral['value'];
};

export class BigIntLiteralTypeClass extends LwcCommonTypeClass<
    'bigIntLiteral',
    BigIntLiteralFields
> {
    private constructor(value: FieldsOf<BigIntLiteralFields>, sourceSpan: SourceSpan) {
        super('bigIntLiteral', value, sourceSpan);
    }

    static create(target: BigIntLiteral, originalSource: string): BigIntLiteralTypeClass {
        return new BigIntLiteralTypeClass(
            {
                value: target.value,
            },
            getSourceSpan(target, originalSource),
        );
    }

    getValue(): BigIntLiteralFields['value'] {
        return this.getFields().value;
    }
}

export const bigIntLiteralTypePair: EvaluatePair<BigIntLiteral, BigIntLiteralTypeClass> =
    makeEvaluatePair(isBigIntLiteral, (target, originalSource) =>
        BigIntLiteralTypeClass.create(target, originalSource),
    );

export const isBigIntLiteralType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is BigIntLiteralTypeClass => target instanceof BigIntLiteralTypeClass;
