import { ExpressionListContext } from '@apexdevtools/apex-parser';

import {
    BasedExpressionTypeClass,
    ExpressionVisitor,
    isBasedExpressionType,
} from '../expressionVisitor';
import {
    ApexCommonTypeClass,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
    visitNodeList,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type ExpressionListType = TypeField<'expressionList'> & {
    value: BasedExpressionTypeClass[];
};

export class ExpressionListTypeClass extends ApexCommonTypeClass<
    'expressionList',
    ExpressionListType
> {
    private constructor(fields: FieldsOf<ExpressionListType>, sourceSpan: SourceSpan) {
        super('expressionList', fields, sourceSpan);
    }

    static create(ctx: ExpressionListContext): ExpressionListTypeClass {
        return new ExpressionListTypeClass(
            {
                value: visitNodeList(
                    new ExpressionVisitor(),
                    ctx.expression_list(),
                    isBasedExpressionType,
                    'expression',
                ),
            },
            getSourceSpan(ctx),
        );
    }

    getValue(): ExpressionListType['value'] {
        return this.getFields().value;
    }
}

export const isExpressionListType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is ExpressionListTypeClass => isSpicifyApexCommonTypeClass('expressionList', target);
