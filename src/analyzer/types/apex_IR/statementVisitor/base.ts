import type { AccessLevelTypeClass } from './accessLevel';
import { ErrorTypeClass, CommonTypeClass } from '../commonVisitor';

export class StatementTypeClass<TName extends string, T> extends CommonTypeClass<TName> {
    private value: T | ErrorTypeClass;
    constructor(type: TName, value: T | ErrorTypeClass) {
        super(type);
        this.value = value;
    }

    getValue(): T | ErrorTypeClass {
        return this.value;
    }
}

export class StatementListTypeClass<TName extends string, T> extends CommonTypeClass<TName> {
    private value: (T | ErrorTypeClass)[];
    constructor(type: TName, value: (T | ErrorTypeClass)[]) {
        super(type);
        this.value = value;
    }

    getValue(): (T | ErrorTypeClass)[] {
        return this.value;
    }
}

export class DmlStatementTypeClass<TName extends string, T> extends StatementTypeClass<TName, T> {
    private accessLevel: AccessLevelTypeClass | ErrorTypeClass | null = null;
    constructor(
        type: TName,
        value: T | ErrorTypeClass,
        accessLevel: AccessLevelTypeClass | ErrorTypeClass | null,
    ) {
        super(type, value);
        this.accessLevel = accessLevel;
    }

    getAccessLevel(): AccessLevelTypeClass | ErrorTypeClass | null {
        return this.accessLevel;
    }
}

export type StatementAllTypeClass =
    StatementTypeClass<string, unknown> | StatementListTypeClass<string, unknown>;

export const isStatementTypeAll = (
    target: CommonTypeClass<string>,
): target is StatementAllTypeClass => {
    return target instanceof StatementTypeClass || target instanceof StatementListTypeClass;
};
