import type { AccessLevelTypeClass } from './accessLevel';
import { ErrorTypeClass, CommonTypeClass } from '../commonVisitor';

export class StatementTypeClass<T> extends CommonTypeClass {
    private value: T | ErrorTypeClass;
    constructor(type: string, value: T | ErrorTypeClass) {
        super(type);
        this.value = value;
    }

    getValue(): T | ErrorTypeClass {
        return this.value;
    }
}

export class StatementListTypeClass<T> extends CommonTypeClass {
    private value: (T | ErrorTypeClass)[];
    constructor(type: string, value: (T | ErrorTypeClass)[]) {
        super(type);
        this.value = value;
    }

    getValue(): (T | ErrorTypeClass)[] {
        return this.value;
    }
}

export class DmlStatementTypeClass<T> extends StatementTypeClass<T> {
    private accessLevel: AccessLevelTypeClass | ErrorTypeClass | null = null;
    constructor(
        type: string,
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

export type StatementAllTypeClass = StatementTypeClass<unknown> | StatementListTypeClass<unknown>;

export const isStatementTypeAll = (target: CommonTypeClass): target is StatementAllTypeClass => {
    return target instanceof StatementTypeClass || target instanceof StatementListTypeClass;
};
