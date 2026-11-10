import { PrimaryExpressionContext } from '@apexdevtools/apex-parser';

import { BasedPrimaryTypeClass, PrimaryVisitor, isBasedPrimaryType } from '../primaryVisitor';
import {
    ApexCommonTypeClass,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
    visitNode,
} from '../commonVisitor';
import { type FieldsOf, SourceSpan, TypeField } from '../../commons/ir';

export type PrimaryExpressionType = TypeField<'primaryExpression'> & {
    value: BasedPrimaryTypeClass;
};

export class PrimaryExpressionTypeClass extends ApexCommonTypeClass<
    'primaryExpression',
    PrimaryExpressionType
> {
    private constructor(fields: FieldsOf<PrimaryExpressionType>, sourceSpan: SourceSpan) {
        super('primaryExpression', fields, sourceSpan);
    }

    static create(ctx: PrimaryExpressionContext): PrimaryExpressionTypeClass {
        return new PrimaryExpressionTypeClass(
            {
                value: visitNode(
                    new PrimaryVisitor(),
                    ctx.primary(),
                    isBasedPrimaryType,
                    'primary',
                ),
            },
            getSourceSpan(ctx),
        );
    }

    getValue(): PrimaryExpressionType['value'] {
        return this.getFields().value;
    }
}

export const isPrimaryExpressionType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is PrimaryExpressionTypeClass =>
    isSpicifyApexCommonTypeClass('primaryExpression', target);
