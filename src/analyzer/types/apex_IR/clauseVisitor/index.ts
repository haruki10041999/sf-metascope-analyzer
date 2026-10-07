import {
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

// 各ファイルより先に base を評価させ、循環 import 時の TDZ を防ぐ
export * from './base';
import type { ClauseAllTypeClass } from './base';

import { CatchClauseTypeClass } from './catchClause';
import { AllRowsClauseTypeClass } from './allRowsClause';
import { OffsetClauseTypeClass } from './offsetClause';
import { LimitClauseTypeClass } from './limitClause';
import { ForClausesTypeClass } from './forClauses';
import { ElseClauseTypeClass } from './elseClause';
import { GroupByClauseTypeClass } from './groupByClause';
import { OrderByClauseTypeClass } from './orderByClause';
import { WithClauseTypeClass } from './withClause';
import { WhereClauseTypeClass } from './whereClause';
import { WhenClauseTypeClass } from './whenClause';
import { SoslWithClauseTypeClass } from './soslWithClause';
import { SoslClausesTypeClass } from './soslClauses';
import { DataCategorySelectionTypeClass } from './dataCategorySelection';
import { FieldGroupByTypeClass } from './fieldGroupBy';
import { FieldOrderTypeClass } from './fieldOrder';
import { FilteringSelectorTypeClass } from './filteringSelector';
import { UpdateTypeTypeClass } from './updateType';
import { UsingScopeTypeClass } from './usingScope';
import { TypeOfTypeClass } from './typeOf';

import { CommonVisitor } from '../commonVisitor';

export { isAllRowsClauseType, AllRowsClauseTypeClass } from './allRowsClause';
export { isCatchClauseType, CatchClauseTypeClass } from './catchClause';
export { isFilteringSelectorType, FilteringSelectorTypeClass } from './filteringSelector';
export {
    isDataCategorySelectionType,
    DataCategorySelectionTypeClass,
} from './dataCategorySelection';
export { isElseClauseType, ElseClauseTypeClass } from './elseClause';
export { isFieldGroupByType, FieldGroupByTypeClass } from './fieldGroupBy';
export { isFieldOrderType, FieldOrderTypeClass } from './fieldOrder';
export { isForClausesType, ForClausesTypeClass } from './forClauses';
export { isGroupByClauseType, GroupByClauseTypeClass } from './groupByClause';
export { isLimitClauseType, LimitClauseTypeClass } from './limitClause';
export { isOffsetClauseType, OffsetClauseTypeClass } from './offsetClause';
export { isOrderByClauseType, OrderByClauseTypeClass } from './orderByClause';
export { isUpdateTypeType, UpdateTypeTypeClass } from './updateType';
export { isUsingScopeType, UsingScopeTypeClass } from './usingScope';
export { isWhenClauseType, WhenClauseTypeClass } from './whenClause';
export { isTypeOfType, TypeOfTypeClass } from './typeOf';
export { isWhereClauseType, WhereClauseTypeClass } from './whereClause';
export { isWithClauseType, WithClauseTypeClass } from './withClause';
export { isSoslClausesType, SoslClausesTypeClass } from './soslClauses';
export { isSoslWithClauseType, SoslWithClauseTypeClass } from './soslWithClause';

export class ClauseVisitor extends CommonVisitor<ClauseAllTypeClass> {
    visitCatchClause(ctx: CatchClauseContext) {
        return CatchClauseTypeClass.create(ctx);
    }

    visitAllRowsClause(ctx: AllRowsClauseContext) {
        return AllRowsClauseTypeClass.create(ctx);
    }

    visitOffsetClause(ctx: OffsetClauseContext) {
        return OffsetClauseTypeClass.create(ctx);
    }

    visitLimitClause(ctx: LimitClauseContext) {
        return LimitClauseTypeClass.create(ctx);
    }

    visitForClauses(ctx: ForClausesContext) {
        return ForClausesTypeClass.create(ctx);
    }

    visitElseClause(ctx: ElseClauseContext) {
        return ElseClauseTypeClass.create(ctx);
    }

    visitGroupByClause(ctx: GroupByClauseContext) {
        return GroupByClauseTypeClass.create(ctx);
    }

    visitOrderByClause(ctx: OrderByClauseContext) {
        return OrderByClauseTypeClass.create(ctx);
    }

    visitWithClause(ctx: WithClauseContext) {
        return WithClauseTypeClass.create(ctx);
    }

    visitWhereClause(ctx: WhereClauseContext) {
        return WhereClauseTypeClass.create(ctx);
    }

    visitWhenClause(ctx: WhenClauseContext) {
        return WhenClauseTypeClass.create(ctx);
    }

    visitSoslWithClause(ctx: SoslWithClauseContext) {
        return SoslWithClauseTypeClass.create(ctx);
    }

    visitSoslClauses(ctx: SoslClausesContext) {
        return SoslClausesTypeClass.create(ctx);
    }

    visitDataCategorySelection(ctx: DataCategorySelectionContext) {
        return DataCategorySelectionTypeClass.create(ctx);
    }

    visitFieldGroupBy(ctx: FieldGroupByContext) {
        return FieldGroupByTypeClass.create(ctx);
    }

    visitFieldOrder(ctx: FieldOrderContext) {
        return FieldOrderTypeClass.create(ctx);
    }

    visitFilteringSelector(ctx: FilteringSelectorContext) {
        return FilteringSelectorTypeClass.create(ctx);
    }

    visitUpdateType(ctx: UpdateTypeContext) {
        return UpdateTypeTypeClass.create(ctx);
    }

    visitUsingScope(ctx: UsingScopeContext) {
        return UsingScopeTypeClass.create(ctx);
    }

    visitTypeOf(ctx: TypeOfContext) {
        return TypeOfTypeClass.create(ctx);
    }
}
