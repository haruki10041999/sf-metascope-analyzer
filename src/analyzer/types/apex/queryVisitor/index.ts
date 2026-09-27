import { ApexParserBaseVisitor, QueryContext, SubQueryContext } from '@apexdevtools/apex-parser';

import { QueryType as queryType, makeQueryType } from './query';
import { SubQueryType, makeSubQueryType } from './subQuery';

export type QueryType = queryType | SubQueryType;

export class QueryVisitor extends ApexParserBaseVisitor<QueryType> {
    visitQuery(ctx: QueryContext) {
        return makeQueryType(ctx);
    }

    visitSubQuery(ctx: SubQueryContext) {
        return makeSubQueryType(ctx);
    }
}
