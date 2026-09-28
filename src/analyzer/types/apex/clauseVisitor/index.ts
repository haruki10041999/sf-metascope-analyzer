import {
    ApexParserBaseVisitor,
    CatchClauseContext,
    AllRowsClauseContext,
    OffsetClauseContext,
    LimitClauseContext,
    ForClausesContext,
    ElseClauseContext,
    GroupByClauseContext,
    OrderByClauseContext,
    WithClauseContext,
    WhereClauseContext,
    WhenClauseContext,
    SoslWithClauseContext,
    SoslClausesContext,
    DataCategorySelectionContext,
    FieldGroupByContext,
    FieldOrderContext,
    FilteringSelectorContext,
    UpdateTypeContext,
    UsingScopeContext,
    TypeOfContext,
} from '@apexdevtools/apex-parser';

import { CatchClauseType, makeCatchClauseType } from './catchClause';
import { AllRowClauseType, makeAllRowClauseType } from './allRowClause';
import { OffsetClauseType, makeOffsetClauseType } from './offsetClause';
import { LimitClauseType, makeLimitClauseType } from './limitClause';
import { ForClausesType, makeForClausesType } from './forClauses';
import { ElseClauseType, makeElseClauseType } from './elseClause';
import { GroupByClauseType, makeGroupByClauseType } from './GroupByClause';
import { OrderByClauseType, makeOrderByClauseType } from './orderByClause';
import { WithClauseType, makeWithClauseType } from './withClause';
import { WhereClauseType, makeWhereClauseType } from './whereClause';
import { WhenClauseType, makeWhenClauseType } from './whenClause';
import { SoslWithClauseType, makeSoslWithClauseType } from './soslWithClause';
import { SoslClausesType, makeSoslClausesType } from './soslClauses';
import { DataCategorySelectionType, makeDataCategorySelectionType } from './dataCategorySelection';
import { FieldGroupByType, makeFieldGroupByType } from './fieldGroupBy';
import { FieldOrderType, makeFieldOrderType } from './fieldOrder';
import { FilteringSelectorType, makeFilteringSelectorType } from './filteringSelector';
import { UpdateTypeType, makeUpdateTypeType } from './updateType';
import { UsingScopeType, makeUsingScopeType } from './usingScope';
import { TypeOfType, makeTypeOfType } from './typeOf';

export type ClauseType =
    | CatchClauseType
    | AllRowClauseType
    | OffsetClauseType
    | LimitClauseType
    | ForClausesType
    | ElseClauseType
    | GroupByClauseType
    | OrderByClauseType
    | WithClauseType
    | WhereClauseType
    | WhenClauseType
    | SoslWithClauseType
    | SoslClausesType
    | DataCategorySelectionType
    | FieldGroupByType
    | FieldOrderType
    | FilteringSelectorType
    | UpdateTypeType
    | UsingScopeType
    | TypeOfType;

export class ClauseVisitor extends ApexParserBaseVisitor<ClauseType> {
    visitCatchClause(ctx: CatchClauseContext) {
        console.log('解析を開始します。' + 'CatchClauseContext:  ' + ctx.getText());
        const result = makeCatchClauseType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'CatchClauseContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitAllRowsClause(ctx: AllRowsClauseContext) {
        console.log('解析を開始します。' + 'AllRowsClauseContext:  ' + ctx.getText());
        const result = makeAllRowClauseType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'AllRowsClauseContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitOffsetClause(ctx: OffsetClauseContext) {
        console.log('解析を開始します。' + 'OffsetClauseContext:  ' + ctx.getText());
        const result = makeOffsetClauseType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'OffsetClauseContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitLimitClause(ctx: LimitClauseContext) {
        console.log('解析を開始します。' + 'LimitClauseContext:  ' + ctx.getText());
        const result = makeLimitClauseType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'LimitClauseContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitForClauses(ctx: ForClausesContext) {
        console.log('解析を開始します。' + 'ForClausesContext:  ' + ctx.getText());
        const result = makeForClausesType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'ForClausesContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitElseClause(ctx: ElseClauseContext) {
        console.log('解析を開始します。' + 'ElseClauseContext:  ' + ctx.getText());
        const result = makeElseClauseType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'ElseClauseContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitGroupByClause(ctx: GroupByClauseContext) {
        console.log('解析を開始します。' + 'GroupByClauseContext:  ' + ctx.getText());
        const result = makeGroupByClauseType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'GroupByClauseContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitOrderByClause(ctx: OrderByClauseContext) {
        console.log('解析を開始します。' + 'OrderByClauseContext:  ' + ctx.getText());
        const result = makeOrderByClauseType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'OrderByClauseContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitWithClause(ctx: WithClauseContext) {
        console.log('解析を開始します。' + 'WithClauseContext:  ' + ctx.getText());
        const result = makeWithClauseType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'WithClauseContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitWhereClause(ctx: WhereClauseContext) {
        console.log('解析を開始します。' + 'WhereClauseContext:  ' + ctx.getText());
        const result = makeWhereClauseType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'WhereClauseContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitWhenClause(ctx: WhenClauseContext) {
        console.log('解析を開始します。' + 'WhenClauseContext:  ' + ctx.getText());
        const result = makeWhenClauseType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'WhenClauseContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitSoslWithClause(ctx: SoslWithClauseContext) {
        console.log('解析を開始します。' + 'SoslWithClauseContext:  ' + ctx.getText());
        const result = makeSoslWithClauseType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'SoslWithClauseContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitSoslClauses(ctx: SoslClausesContext) {
        console.log('解析を開始します。' + 'SoslClausesContext:  ' + ctx.getText());
        const result = makeSoslClausesType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'SoslClausesContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitDataCategorySelection(ctx: DataCategorySelectionContext) {
        console.log('解析を開始します。' + 'DataCategorySelectionContext:  ' + ctx.getText());
        const result = makeDataCategorySelectionType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'DataCategorySelectionContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitFieldGroupBy(ctx: FieldGroupByContext) {
        console.log('解析を開始します。' + 'FieldGroupByContext:  ' + ctx.getText());
        const result = makeFieldGroupByType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'FieldGroupByContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitFieldOrder(ctx: FieldOrderContext) {
        console.log('解析を開始します。' + 'FieldOrderContext:  ' + ctx.getText());
        const result = makeFieldOrderType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'FieldOrderContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitFilteringSelector(ctx: FilteringSelectorContext) {
        console.log('解析を開始します。' + 'FilteringSelectorContext:  ' + ctx.getText());
        const result = makeFilteringSelectorType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'FilteringSelectorContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitUpdateType(ctx: UpdateTypeContext) {
        console.log('解析を開始します。' + 'UpdateTypeContext:  ' + ctx.getText());
        const result = makeUpdateTypeType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'UpdateTypeContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitUsingScope(ctx: UsingScopeContext) {
        console.log('解析を開始します。' + 'UsingScopeContext:  ' + ctx.getText());
        const result = makeUsingScopeType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'UsingScopeContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }

    visitTypeOf(ctx: TypeOfContext) {
        console.log('解析を開始します。' + 'TypeOfContext:  ' + ctx.getText());
        const result = makeTypeOfType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'TypeOfContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }
}
