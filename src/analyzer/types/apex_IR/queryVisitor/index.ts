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
import { ComparisonOperatorTypeClass } from './comparisonOperator';
import { DateFormulaTypeClass } from './dateFormula';
import { FieldSpecType, makeFieldSpecType } from './fieldSpec';
import { SoqlFunctionTypeClass } from './soqlFunction';
import { SearchGroupType, makeSearchGroupType } from './searchGroup';

import { ErrorTypeClass, CommonTypeClass, CommonVisitor } from '../commonVisitor';

export { isComparisonOperatorType, ComparisonOperatorTypeClass } from './comparisonOperator';
export { isDateFormulaType, DateFormulaTypeClass } from './dateFormula';
export { isSoqlFunctionType, SoqlFunctionTypeClass } from './soqlFunction';

export class QueryTypeClass<T> extends CommonTypeClass {
    private value: T | ErrorTypeClass;
    constructor(type: string, value: T | ErrorTypeClass) {
        super(type);
        this.value = value;
    }

    getValue(): T | ErrorTypeClass {
        return this.value;
    }
}

export const isQueryTypeAll = (target: CommonTypeClass): target is QueryTypeClass<unknown> => {
    return target instanceof QueryTypeClass;
};

export class QueryVisitor extends CommonVisitor<QueryTypeClass<unknown>> {
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
        return ComparisonOperatorTypeClass.create(ctx);
    }

    visitDateFormula(ctx: DateFormulaContext) {
        return DateFormulaTypeClass.create(ctx);
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
        return SoqlFunctionTypeClass.create(ctx);
    }
}
