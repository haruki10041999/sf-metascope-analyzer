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

import { ErrorType, CommonVisitor } from '../commonVisitor';

export type QueryType =
    | queryType
    | SubQueryType
    | ComparisonOperatorType
    | DateFormulaType
    | FieldSpecType
    | SearchGroupType
    | SoqlFunctionType
    | ErrorType;

export class QueryVisitor extends CommonVisitor<QueryType> {
    visitQuery(ctx: QueryContext) {
        console.log('解析を開始します。' + 'QueryContext:  ' + ctx.getText());
        const result = makeQueryType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'QueryContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitSubQuery(ctx: SubQueryContext) {
        console.log('解析を開始します。' + 'SubQueryContext:  ' + ctx.getText());
        const result = makeSubQueryType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'SubQueryContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitComparisonOperator(ctx: ComparisonOperatorContext) {
        console.log('解析を開始します。' + 'ComparisonOperatorContext:  ' + ctx.getText());
        const result = makeComparisonOperatorType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'ComparisonOperatorContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitDateFormula(ctx: DateFormulaContext) {
        console.log('解析を開始します。' + 'DateFormulaContext:  ' + ctx.getText());
        const result = makeDateFormulaType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'DateFormulaContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitFieldSpec(ctx: FieldSpecContext) {
        console.log('解析を開始します。' + 'FieldSpecContext:  ' + ctx.getText());
        const result = makeFieldSpecType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'FieldSpecContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitSearchGroup(ctx: SearchGroupContext) {
        console.log('解析を開始します。' + 'SearchGroupContext:  ' + ctx.getText());
        const result = makeSearchGroupType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'SearchGroupContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitSoqlFunction(ctx: SoqlFunctionContext) {
        console.log('解析を開始します。' + 'SoqlFunctionContext:  ' + ctx.getText());
        const result = makeSoqlFunctionType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'SoqlFunctionContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }
}

