import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isBooleanLiteral, type BooleanLiteral } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    getSourceSpan,
} from '../commonVisitor';

export type BooleanLiteralFields = TypeField<'booleanLiteral'> & {
    value: BooleanLiteral['value'];
};

export class BooleanLiteralTypeClass extends LwcCommonTypeClass<
    'booleanLiteral',
    BooleanLiteralFields
> {
    private constructor(value: FieldsOf<BooleanLiteralFields>, sourceSpan: SourceSpan) {
        super('booleanLiteral', value, sourceSpan);
    }

    static create(target: BooleanLiteral, originalSource: string): BooleanLiteralTypeClass {
        return new BooleanLiteralTypeClass(
            {
                value: target.value,
            },
            getSourceSpan(target, originalSource),
        );
    }

    getValue(): BooleanLiteralFields['value'] {
        return this.getFields().value;
    }
}

export const booleanLiteralTypePair: EvaluatePair<BooleanLiteral, BooleanLiteralTypeClass> =
    makeEvaluatePair(isBooleanLiteral, (target, originalSource) =>
        BooleanLiteralTypeClass.create(target, originalSource),
    );

export const isBooleanLiteralType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is BooleanLiteralTypeClass => target instanceof BooleanLiteralTypeClass;
