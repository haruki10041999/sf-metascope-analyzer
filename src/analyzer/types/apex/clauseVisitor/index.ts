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
        return makeCatchClauseType(ctx);
    }

    visitAllRowsClause(ctx: AllRowsClauseContext) {
        return makeAllRowClauseType(ctx);
    }

    visitOffsetClause(ctx: OffsetClauseContext) {
        return makeOffsetClauseType(ctx);
    }

    visitLimitClause(ctx: LimitClauseContext) {
        return makeLimitClauseType(ctx);
    }

    visitForClauses(ctx: ForClausesContext) {
        return makeForClausesType(ctx);
    }

    visitElseClause(ctx: ElseClauseContext) {
        return makeElseClauseType(ctx);
    }

    visitGroupByClause(ctx: GroupByClauseContext) {
        return makeGroupByClauseType(ctx);
    }

    visitOrderByClause(ctx: OrderByClauseContext) {
        return makeOrderByClauseType(ctx);
    }

    visitWithClause(ctx: WithClauseContext) {
        return makeWithClauseType(ctx);
    }

    visitWhereClause(ctx: WhereClauseContext) {
        return makeWhereClauseType(ctx);
    }

    visitWhenClause(ctx: WhenClauseContext) {
        return makeWhenClauseType(ctx);
    }

    visitSoslWithClause(ctx: SoslWithClauseContext) {
        return makeSoslWithClauseType(ctx);
    }

    visitSoslClauses(ctx: SoslClausesContext) {
        return makeSoslClausesType(ctx);
    }

    visitDataCategorySelection(ctx: DataCategorySelectionContext) {
        return makeDataCategorySelectionType(ctx);
    }

    visitFieldGroupBy(ctx: FieldGroupByContext) {
        return makeFieldGroupByType(ctx);
    }

    visitFieldOrder(ctx: FieldOrderContext) {
        return makeFieldOrderType(ctx);
    }

    visitFilteringSelector(ctx: FilteringSelectorContext) {
        return makeFilteringSelectorType(ctx);
    }

    visitUpdateType(ctx: UpdateTypeContext) {
        return makeUpdateTypeType(ctx);
    }

    visitUsingScope(ctx: UsingScopeContext) {
        return makeUsingScopeType(ctx);
    }

    visitTypeOf(ctx: TypeOfContext) {
        return makeTypeOfType(ctx);
    }
}
