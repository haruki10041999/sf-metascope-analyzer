import { QueryContext } from '@apexdevtools/apex-parser';

import { SelectListTypeClass, FromNameListTypeClass, UpdateListTypeClass } from '../listVisitor';
import {
    ForClausesTypeClass,
    UsingScopeTypeClass,
    WhereClauseTypeClass,
    WithClauseTypeClass,
    GroupByClauseTypeClass,
    OrderByClauseTypeClass,
    LimitClauseTypeClass,
    OffsetClauseTypeClass,
    AllRowsClauseTypeClass,
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

export type QueryType = TypeField<'query'> & {
    value: SelectListTypeClass;
    from: FromNameListTypeClass;
    forClause: ForClausesTypeClass | null;
    usingScope: UsingScopeTypeClass | null;
    whereClause: WhereClauseTypeClass | null;
    withClause: WithClauseTypeClass | null;
    groupByClause: GroupByClauseTypeClass | null;
    orderByClause: OrderByClauseTypeClass | null;
    limitClause: LimitClauseTypeClass | null;
    offsetClause: OffsetClauseTypeClass | null;
    allRowsClause: AllRowsClauseTypeClass | null;
    updateList: UpdateListTypeClass | null;
};

export class QueryTypeClass extends ApexCommonTypeClass<'query', QueryType> {
    private constructor(fields: FieldsOf<QueryType>, sourceSpan: SourceSpan) {
        super('query', fields, sourceSpan);
    }

    static create(ctx: QueryContext): QueryTypeClass {
        return new QueryTypeClass(
            {
                value: createNode(
                    ctx.selectList(),
                    (c) => SelectListTypeClass.create(c),
                    'selectList',
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
                usingScope: createOptionalNode(
                    ctx.usingScope(),
                    (c) => UsingScopeTypeClass.create(c),
                    'usingScope',
                ),
                whereClause: createOptionalNode(
                    ctx.whereClause(),
                    (c) => WhereClauseTypeClass.create(c),
                    'whereClause',
                ),
                withClause: createOptionalNode(
                    ctx.withClause(),
                    (c) => WithClauseTypeClass.create(c),
                    'withClause',
                ),
                groupByClause: createOptionalNode(
                    ctx.groupByClause(),
                    (c) => GroupByClauseTypeClass.create(c),
                    'groupByClause',
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
                offsetClause: createOptionalNode(
                    ctx.offsetClause(),
                    (c) => OffsetClauseTypeClass.create(c),
                    'offsetClause',
                ),
                allRowsClause: createOptionalNode(
                    ctx.allRowsClause(),
                    (c) => AllRowsClauseTypeClass.create(c),
                    'allRowsClause',
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

    getValue(): QueryType['value'] {
        return this.getFields().value;
    }

    getFrom(): QueryType['from'] {
        return this.getFields().from;
    }

    getForClause(): QueryType['forClause'] {
        return this.getFields().forClause;
    }

    getUsingScope(): QueryType['usingScope'] {
        return this.getFields().usingScope;
    }

    getWhereClause(): QueryType['whereClause'] {
        return this.getFields().whereClause;
    }

    getWithClause(): QueryType['withClause'] {
        return this.getFields().withClause;
    }

    getGroupByClause(): QueryType['groupByClause'] {
        return this.getFields().groupByClause;
    }

    getOrderByClause(): QueryType['orderByClause'] {
        return this.getFields().orderByClause;
    }

    getLimitClause(): QueryType['limitClause'] {
        return this.getFields().limitClause;
    }

    getOffsetClause(): QueryType['offsetClause'] {
        return this.getFields().offsetClause;
    }

    getAllRowsClause(): QueryType['allRowsClause'] {
        return this.getFields().allRowsClause;
    }

    getUpdateList(): QueryType['updateList'] {
        return this.getFields().updateList;
    }
}

export const isQueryType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is QueryTypeClass => {
    return isSpicifyApexCommonTypeClass('query', target);
};
