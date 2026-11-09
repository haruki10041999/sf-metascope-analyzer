import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isStringLiteral, type StringLiteral } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    getSourceSpan,
} from '../commonVisitor';

export type StringLiteralFields = TypeField<'stringLiteral'> & {
    value: StringLiteral['value'];
};

export class StringLiteralTypeClass extends LwcCommonTypeClass<
    'stringLiteral',
    StringLiteralFields
> {
    private constructor(value: FieldsOf<StringLiteralFields>, sourceSpan: SourceSpan) {
        super('stringLiteral', value, sourceSpan);
    }

    static create(target: StringLiteral, originalSource: string): StringLiteralTypeClass {
        return new StringLiteralTypeClass(
            {
                value: target.value,
            },
            getSourceSpan(target, originalSource),
        );
    }

    getValue(): StringLiteralFields['value'] {
        return this.getFields().value;
    }
}

export const stringLiteralTypePair: EvaluatePair<StringLiteral, StringLiteralTypeClass> =
    makeEvaluatePair(isStringLiteral, (target, originalSource) =>
        StringLiteralTypeClass.create(target, originalSource),
    );

export const isStringLiteralType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is StringLiteralTypeClass => target instanceof StringLiteralTypeClass;
