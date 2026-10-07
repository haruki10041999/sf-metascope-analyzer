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

// 各ファイルより先に base を評価させ、循環 import 時の TDZ を防ぐ
export * from './base';
import type { QueryAllTypeClass } from './base';

import { NormalQueryTypeClass } from './normal';
import { SubQueryTypeClass } from './subQuery';
import { ComparisonOperatorTypeClass } from './comparisonOperator';
import { DateFormulaTypeClass } from './dateFormula';
import { FieldSpecTypeClass } from './fieldSpec';
import { SoqlFunctionTypeClass } from './soqlFunction';
import { SearchGroupTypeClass } from './searchGroup';

import { CommonVisitor } from '../commonVisitor';

export { isComparisonOperatorType, ComparisonOperatorTypeClass } from './comparisonOperator';
export { isDateFormulaType, DateFormulaTypeClass } from './dateFormula';
export { isSoqlFunctionType, SoqlFunctionTypeClass } from './soqlFunction';
export { isSearchGroupType, SearchGroupTypeClass } from './searchGroup';
export { isNormalQueryType, NormalQueryTypeClass } from './normal';
export { isSubQueryType, SubQueryTypeClass } from './subQuery';
export { isFieldSpecType, FieldSpecTypeClass } from './fieldSpec';

export class QueryVisitor extends CommonVisitor<QueryAllTypeClass> {
    visitQuery(ctx: QueryContext) {
        return NormalQueryTypeClass.create(ctx);
    }

    visitSubQuery(ctx: SubQueryContext) {
        return SubQueryTypeClass.create(ctx);
    }

    visitComparisonOperator(ctx: ComparisonOperatorContext) {
        return ComparisonOperatorTypeClass.create(ctx);
    }

    visitDateFormula(ctx: DateFormulaContext) {
        return DateFormulaTypeClass.create(ctx);
    }

    visitFieldSpec(ctx: FieldSpecContext) {
        return FieldSpecTypeClass.create(ctx);
    }

    visitSearchGroup(ctx: SearchGroupContext) {
        return SearchGroupTypeClass.create(ctx);
    }

    visitSoqlFunction(ctx: SoqlFunctionContext) {
        return SoqlFunctionTypeClass.create(ctx);
    }
}

