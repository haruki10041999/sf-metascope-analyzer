import { ReturnStatementContext } from '@apexdevtools/apex-parser';

import {
    BasedExpressionTypeClass,
    ExpressionVisitor,
    isBasedExpressionType,
} from '../expressionVisitor';
import {
    ApexCommonTypeClass,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
    visitOptionalNode,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type ReturnStatementType = TypeField<'returnStatement'> & {
    /** void メソッドの `return;` は式を持たない */
    value: BasedExpressionTypeClass | null;
};

export class ReturnStatementTypeClass extends ApexCommonTypeClass<
    'returnStatement',
    ReturnStatementType
> {
    private constructor(fields: FieldsOf<ReturnStatementType>, sourceSpan: SourceSpan) {
        super('returnStatement', fields, sourceSpan);
    }

    static create(ctx: ReturnStatementContext): ReturnStatementTypeClass {
        return new ReturnStatementTypeClass(
            {
                value: visitOptionalNode(
                    new ExpressionVisitor(),
                    ctx.expression(),
                    isBasedExpressionType,
                    'expression',
                ),
            },
            getSourceSpan(ctx),
        );
    }

    getValue(): ReturnStatementType['value'] {
        return this.getFields().value;
    }
}

export const isReturnStatementType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is ReturnStatementTypeClass => {
    return isSpicifyApexCommonTypeClass('returnStatement', target);
};
