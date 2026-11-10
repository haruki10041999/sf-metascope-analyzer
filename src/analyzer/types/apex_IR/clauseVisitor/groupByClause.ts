import { GroupByClauseContext } from '@apexdevtools/apex-parser';

import { LogicalExpressionTypeClass } from '../expressionVisitor';
import { FieldGroupByListTypeClass } from '../listVisitor';
import {
    ApexCommonTypeClass,
    createNode,
    createOptionalNode,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type GroupByClauseType = TypeField<'groupByClause'> & {
    value: FieldGroupByListTypeClass;
    mode: 'ROLLUP' | 'CUBE' | null;
    having: LogicalExpressionTypeClass | null;
};

export class GroupByClauseTypeClass extends ApexCommonTypeClass<
    'groupByClause',
    GroupByClauseType
> {
    private constructor(fields: FieldsOf<GroupByClauseType>, sourceSpan: SourceSpan) {
        super('groupByClause', fields, sourceSpan);
    }

    static create(ctx: GroupByClauseContext): GroupByClauseTypeClass {
        return new GroupByClauseTypeClass(
            {
                value: createNode(
                    ctx.fieldGroupByList(),
                    (c) => FieldGroupByListTypeClass.create(c),
                    'fieldGroupByList',
                ),
                mode: ctx.ROLLUP() ? 'ROLLUP' : ctx.CUBE() ? 'CUBE' : null,
                having: ctx.HAVING()
                    ? createOptionalNode(
                          ctx.logicalExpression(),
                          (c) => LogicalExpressionTypeClass.create(c),
                          'logicalExpression',
                      )
                    : null,
            },
            getSourceSpan(ctx),
        );
    }

    getValue(): GroupByClauseType['value'] {
        return this.getFields().value;
    }

    getMode(): GroupByClauseType['mode'] {
        return this.getFields().mode;
    }

    getHaving(): GroupByClauseType['having'] {
        return this.getFields().having;
    }
}

export const isGroupByClauseType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is GroupByClauseTypeClass => {
    return isSpicifyApexCommonTypeClass('groupByClause', target);
};
