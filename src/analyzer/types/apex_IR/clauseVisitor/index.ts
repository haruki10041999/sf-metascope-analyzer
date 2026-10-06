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

import { CatchClauseTypeClass } from './catchClause';
import { AllRowsClauseTypeClass } from './allRowClause';
import { OffsetClauseTypeClass } from './offsetClause';
import { LimitClauseTypeClass } from './limitClause';
import { ForClausesTypeClass } from './forClauses';
import { ElseClauseTypeClass } from './elseClause';
import { GroupByClauseTypeClass } from './GroupByClause';
import { OrderByClauseTypeClass } from './orderByClause';
import { WithClauseTypeClass } from './withClause';
import { WhereClauseTypeClass } from './whereClause';
import { WhenClauseTypeClass } from './whenClause';
import { SoslWithClauseType, makeSoslWithClauseType } from './soslWithClause';
import { SoslClausesType, makeSoslClausesType } from './soslClauses';
import {
    isDataCategorySelectionType,
    DataCategorySelectionTypeClass,
} from './dataCategorySelection';
import { FieldGroupByTypeClass } from './fieldGroupBy';
import { FieldOrderTypeClass } from './fieldOrder';
import { FilteringSelectorTypeClass } from './filteringSelector';
import { UpdateTypeTypeClass } from './updateType';
import { UsingScopeTypeClass } from './usingScope';
import { TypeOfTypeClass } from './typeOf';

import { ErrorTypeClass, CommonTypeClass, CommonVisitor } from '../commonVisitor';

export { isAllRowsClauseType, AllRowsClauseTypeClass } from './allRowClause';
export { isCatchClauseType, CatchClauseTypeClass } from './catchClause';
export { isFileteringSelectorType, FilteringSelectorTypeClass } from './filteringSelector';
export {
    isDataCategorySelectionType,
    DataCategorySelectionTypeClass,
} from './dataCategorySelection';
export { isElseClauseType, ElseClauseTypeClass } from './elseClause';
export { isFieldGroupByType, FieldGroupByTypeClass } from './fieldGroupBy';
export { isFieldOrderType, FieldOrderTypeClass } from './fieldOrder';
export { isForClausesType, ForClausesTypeClass } from './forClauses';
export { isGroupByClauseType, GroupByClauseTypeClass } from './GroupByClause';
export { isLimitClauseType, LimitClauseTypeClass } from './limitClause';
export { isOffsetClauseType, OffsetClauseTypeClass } from './offsetClause';
export { isOrderByClauseType, OrderByClauseTypeClass } from './orderByClause';
export { isUpdateTypeType, UpdateTypeTypeClass } from './updateType';
export { isUsingScopeType, UsingScopeTypeClass } from './usingScope';
export { isWhenClauseType, WhenClauseTypeClass } from './whenClause';
export { isTypeOfType, TypeOfTypeClass } from './typeOf';
export { isWhereClauseType, WhereClauseTypeClass } from './whereClause';
export { isWithClauseType, WithClauseTypeClass } from './withClause';

export class ClauseTypeClass<T> extends CommonTypeClass {
    private value: T | ErrorTypeClass;
    constructor(type: string, value: T | ErrorTypeClass) {
        super(type);
        this.value = value;
    }

    getValue(): T | ErrorTypeClass {
        return this.value;
    }
}

export class ClauseListTypeClass<T> extends CommonTypeClass {
    private value: (T | ErrorTypeClass)[];
    constructor(type: string, value: (T | ErrorTypeClass)[]) {
        super(type);
        this.value = value;
    }

    getValue(): (T | ErrorTypeClass)[] {
        return this.value;
    }
}

export type ClauseAllTypeClass = ClauseTypeClass<unknown> | ClauseListTypeClass<unknown>;

export const isClauseTypeClass = (target: CommonTypeClass): target is ClauseAllTypeClass => {
    return target instanceof ClauseTypeClass || target instanceof ClauseListTypeClass;
};

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
