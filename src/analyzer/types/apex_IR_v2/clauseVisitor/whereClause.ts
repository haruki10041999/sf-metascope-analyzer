import { WhereClauseContext } from '@apexdevtools/apex-parser';

import { WhereLogicalExpressionTypeClass } from '../expressionVisitor';
import {
    ApexCommonTypeClass,
    createNode,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type WhereClauseType = TypeField<'whereClause'> & {
    value: WhereLogicalExpressionTypeClass;
};

export class WhereClauseTypeClass extends ApexCommonTypeClass<'whereClause', WhereClauseType> {
    private constructor(fields: FieldsOf<WhereClauseType>, sourceSpan: SourceSpan) {
        super('whereClause', fields, sourceSpan);
    }

    static create(ctx: WhereClauseContext): WhereClauseTypeClass {
        return new WhereClauseTypeClass(
            {
                value: createNode(
                    ctx.whereLogicalExpression(),
                    (c) => WhereLogicalExpressionTypeClass.create(c),
                    'whereLogicalExpression',
                ),
            },
            getSourceSpan(ctx),
        );
    }

    getValue(): WhereClauseType['value'] {
        return this.getFields().value;
    }
}

export const isWhereClauseType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is WhereClauseTypeClass => {
    return isSpicifyApexCommonTypeClass('whereClause', target);
};
