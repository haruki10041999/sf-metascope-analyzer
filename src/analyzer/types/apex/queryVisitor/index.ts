import { ApexParserBaseVisitor, QueryContext, SubQueryContext } from '@apexdevtools/apex-parser';

export type QueryType = { type: string };

export class QueryVisitor extends ApexParserBaseVisitor<QueryType> {
    visitQueryContext(ctx: QueryContext) {
        return { type: 'query' };
    }

    visitSubQueryContext(ctx: SubQueryContext) {
        return { type: 'subQuery' };
    }
}
