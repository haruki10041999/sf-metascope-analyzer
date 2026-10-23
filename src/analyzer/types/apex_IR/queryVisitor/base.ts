import type { FromNameListTypeClass, UpdateListTypeClass } from '../listVisitor';
import type {
    ForClausesTypeClass,
    WhereClauseTypeClass,
    OrderByClauseTypeClass,
    LimitClauseTypeClass,
} from '../clauseVisitor';
import { ErrorTypeClass, CommonTypeClass } from '../commonVisitor';

export class QueryTypeClass<TName extends string, T> extends CommonTypeClass<TName> {
    private value: T | ErrorTypeClass;
    constructor(type: TName, value: T | ErrorTypeClass) {
        super(type);
        this.value = value;
    }

    getValue(): T | ErrorTypeClass {
        return this.value;
    }
}

export class SoqlQueryTypeClass<TName extends string, T> extends QueryTypeClass<TName, T> {
    private from: FromNameListTypeClass | ErrorTypeClass;
    private forClause: ForClausesTypeClass | ErrorTypeClass | null = null;
    private whereClause: WhereClauseTypeClass | ErrorTypeClass | null = null;
    private orderByClause: OrderByClauseTypeClass | ErrorTypeClass | null = null;
    private limitClause: LimitClauseTypeClass | ErrorTypeClass | null = null;
    private updateList: UpdateListTypeClass | ErrorTypeClass | null = null;

    constructor(
        type: TName,
        value: T | ErrorTypeClass,
        from: FromNameListTypeClass | ErrorTypeClass,
        forClause: ForClausesTypeClass | ErrorTypeClass | null,
        whereClause: WhereClauseTypeClass | ErrorTypeClass | null,
        orderByClause: OrderByClauseTypeClass | ErrorTypeClass | null,
        limitClause: LimitClauseTypeClass | ErrorTypeClass | null,
        updateList: UpdateListTypeClass | ErrorTypeClass | null,
    ) {
        super(type, value);
        this.from = from;
        this.forClause = forClause;
        this.whereClause = whereClause;
        this.orderByClause = orderByClause;
        this.limitClause = limitClause;
        this.updateList = updateList;
    }

    getFrom(): FromNameListTypeClass | ErrorTypeClass {
        return this.from;
    }

    getForClause(): ForClausesTypeClass | ErrorTypeClass | null {
        return this.forClause;
    }

    getWhereClause(): WhereClauseTypeClass | ErrorTypeClass | null {
        return this.whereClause;
    }

    getOrderByClause(): OrderByClauseTypeClass | ErrorTypeClass | null {
        return this.orderByClause;
    }

    getLimitClause(): LimitClauseTypeClass | ErrorTypeClass | null {
        return this.limitClause;
    }

    getUpdateList(): UpdateListTypeClass | ErrorTypeClass | null {
        return this.updateList;
    }
}

export type QueryAllTypeClass =
    QueryTypeClass<string, unknown> | SoqlQueryTypeClass<string, unknown>;

export const isQueryTypeAll = (target: CommonTypeClass<string>): target is QueryAllTypeClass => {
    return target instanceof QueryTypeClass || target instanceof SoqlQueryTypeClass;
};
