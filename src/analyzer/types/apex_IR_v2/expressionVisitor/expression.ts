import { ExpressionContext } from '@apexdevtools/apex-parser';

import { ApexCommonTypeClass, getSourceSpan, isSpicifyApexCommonTypeClass } from '../commonVisitor';
import { type FieldsOf, SourceSpan, TypeField } from '../../commons/ir';

export type ExpressionType = TypeField<'expression'> & {
    value: string;
};

/** ラベルのない ExpressionContext (ANTLR の回復でできることがある)。テキストだけを持つ */
export class ExpressionTypeClass extends ApexCommonTypeClass<'expression', ExpressionType> {
    private constructor(fields: FieldsOf<ExpressionType>, sourceSpan: SourceSpan) {
        super('expression', fields, sourceSpan);
    }

    static create(ctx: ExpressionContext): ExpressionTypeClass {
        return new ExpressionTypeClass({ value: ctx.getText() }, getSourceSpan(ctx));
    }

    getValue(): ExpressionType['value'] {
        return this.getFields().value;
    }
}

export const isExpressionType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is ExpressionTypeClass => isSpicifyApexCommonTypeClass('expression', target);
