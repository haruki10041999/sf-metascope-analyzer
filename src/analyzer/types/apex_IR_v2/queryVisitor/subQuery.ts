import { SubQueryContext } from '@apexdevtools/apex-parser';

import { SubFieldListTypeClass, FromNameListTypeClass, UpdateListTypeClass } from '../listVisitor';
import {
    ForClausesTypeClass,
    WhereClauseTypeClass,
    OrderByClauseTypeClass,
    LimitClauseTypeClass,
} from '../clauseVisitor';
import {
    ApexCommonTypeClass,
    createNode,
    createOptionalNode,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type SubQueryType = TypeField<'subQuery'> & {
    value: SubFieldListTypeClass;
    from: FromNameListTypeClass;
    forClause: ForClausesTypeClass | null;
    whereClause: WhereClauseTypeClass | null;
    orderByClause: OrderByClauseTypeClass | null;
    limitClause: LimitClauseTypeClass | null;
    updateList: UpdateListTypeClass | null;
};

export class SubQueryTypeClass extends ApexCommonTypeClass<'subQuery', SubQueryType> {
    private constructor(fields: FieldsOf<SubQueryType>, sourceSpan: SourceSpan) {
        super('subQuery', fields, sourceSpan);
    }

    static create(ctx: SubQueryContext): SubQueryTypeClass {
        return new SubQueryTypeClass(
            {
                value: createNode(
                    ctx.subFieldList(),
                    (c) => SubFieldListTypeClass.create(c),
                    'subFieldList',
                ),
                from: createNode(
                    ctx.fromNameList(),
                    (c) => FromNameListTypeClass.create(c),
                    'fromNameList',
                ),
                // forClauses は文法上常に生成されるため、FOR が無ければ null にする
                forClause:
                    ctx.forClauses() && ctx.forClauses().FOR_list().length > 0
                        ? createNode(
                              ctx.forClauses(),
                              (c) => ForClausesTypeClass.create(c),
                              'forClauses',
                          )
                        : null,
                whereClause: createOptionalNode(
                    ctx.whereClause(),
                    (c) => WhereClauseTypeClass.create(c),
                    'whereClause',
                ),
                orderByClause: createOptionalNode(
                    ctx.orderByClause(),
                    (c) => OrderByClauseTypeClass.create(c),
                    'orderByClause',
                ),
                limitClause: createOptionalNode(
                    ctx.limitClause(),
                    (c) => LimitClauseTypeClass.create(c),
                    'limitClause',
                ),
                updateList: createOptionalNode(
                    ctx.updateList(),
                    (c) => UpdateListTypeClass.create(c),
                    'updateList',
                ),
            },
            getSourceSpan(ctx),
        );
    }

    getValue(): SubQueryType['value'] {
        return this.getFields().value;
    }

    getFrom(): SubQueryType['from'] {
        return this.getFields().from;
    }

    getForClause(): SubQueryType['forClause'] {
        return this.getFields().forClause;
    }

    getWhereClause(): SubQueryType['whereClause'] {
        return this.getFields().whereClause;
    }

    getOrderByClause(): SubQueryType['orderByClause'] {
        return this.getFields().orderByClause;
    }

    getLimitClause(): SubQueryType['limitClause'] {
        return this.getFields().limitClause;
    }

    getUpdateList(): SubQueryType['updateList'] {
        return this.getFields().updateList;
    }
}

export const isSubQueryType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is SubQueryTypeClass => {
    return isSpicifyApexCommonTypeClass('subQuery', target);
};
