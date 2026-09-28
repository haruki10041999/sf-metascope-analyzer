import {
    ApexParserBaseVisitor,
    QueryContext,
    SubQueryContext,
    ComparisonOperatorContext,
    DateFormulaContext,
    FieldSpecContext,
    SearchGroupContext,
    SoqlFunctionContext,
} from '@apexdevtools/apex-parser';

import { QueryType as queryType, makeQueryType } from './query';
import { SubQueryType, makeSubQueryType } from './subQuery';
import { ComparisonOperatorType, makeComparisonOperatorType } from './comparisonOperator';
import { DateFormulaType, makeDateFormulaType } from './dateFormula';
import { FieldSpecType, makeFieldSpecType } from './fieldSpec';
import { SoqlFunctionType, makeSoqlFunctionType } from './soqlFunction';
import { SearchGroupType, makeSearchGroupType } from './searchGroup';

export type QueryType =
    | queryType
    | SubQueryType
    | ComparisonOperatorType
    | DateFormulaType
    | FieldSpecType
    | SearchGroupType
    | SoqlFunctionType;

export class QueryVisitor extends ApexParserBaseVisitor<QueryType> {
    visitQuery(ctx: QueryContext) {
        return makeQueryType(ctx);
    }

    visitSubQuery(ctx: SubQueryContext) {
        return makeSubQueryType(ctx);
    }

    visitComparisonOperator(ctx: ComparisonOperatorContext) {
        return makeComparisonOperatorType(ctx);
    }

    visitDateFormula(ctx: DateFormulaContext) {
        return makeDateFormulaType(ctx);
    }

    visitFieldSpec(ctx: FieldSpecContext) {
        return makeFieldSpecType(ctx);
    }

    visitSearchGroup(ctx: SearchGroupContext) {
        return makeSearchGroupType(ctx);
    }

    visitSoqlFunction(ctx: SoqlFunctionContext) {
        return makeSoqlFunctionType(ctx);
    }
}

