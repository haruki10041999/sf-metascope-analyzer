import { ExpressionStatementContext } from '@apexdevtools/apex-parser';

import {
    BasedExpressionTypeClass,
    ExpressionVisitor,
    isBasedExpressionType,
} from '../expressionVisitor';
import {
    ApexCommonTypeClass,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
    visitNode,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type ExpressionStatementType = TypeField<'expressionStatement'> & {
    value: BasedExpressionTypeClass;
};

export class ExpressionStatementTypeClass extends ApexCommonTypeClass<
    'expressionStatement',
    ExpressionStatementType
> {
    private constructor(fields: FieldsOf<ExpressionStatementType>, sourceSpan: SourceSpan) {
        super('expressionStatement', fields, sourceSpan);
    }

    static create(ctx: ExpressionStatementContext): ExpressionStatementTypeClass {
        return new ExpressionStatementTypeClass(
            {
                value: visitNode(
                    new ExpressionVisitor(),
                    ctx.expression(),
                    isBasedExpressionType,
                    'expression',
                ),
            },
            getSourceSpan(ctx),
        );
    }

    getValue(): ExpressionStatementType['value'] {
        return this.getFields().value;
    }
}

export const isExpressionStatementType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is ExpressionStatementTypeClass => {
    return isSpicifyApexCommonTypeClass('expressionStatement', target);
};
