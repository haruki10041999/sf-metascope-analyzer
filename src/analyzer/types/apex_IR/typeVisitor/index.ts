import { ArraySubscriptsContext, TypeRefContext } from '@apexdevtools/apex-parser';

import { ArraySubscriptsTypeClass } from './arraySubscripts';
import { TypeRefTypeClass } from './typeRef';

import { CommonTypeClass, CommonVisitor, ErrorTypeClass } from '../commonVisitor';

export { isArraySubscriptsType, ArraySubscriptsTypeClass } from './arraySubscripts';
export { isTypeRefType, TypeRefTypeClass } from './typeRef';

export class TypeTypeClass<T> extends CommonTypeClass {
    private value: T | ErrorTypeClass;

    constructor(type: string, value: T | ErrorTypeClass) {
        super(type);
        this.value = value;
    }

    getValue(): T | ErrorTypeClass {
        return this.value;
    }
}

export class TypeListTypeClass<T> extends CommonTypeClass {
    private value: (T | ErrorTypeClass)[];

    constructor(type: string, value: (T | ErrorTypeClass)[]) {
        super(type);
        this.value = value;
    }

    getValue(): (T | ErrorTypeClass)[] {
        return this.value;
    }
}

export type TypeAllTypeClass = TypeTypeClass<unknown> | TypeListTypeClass<unknown>;

export const isTypeTypeAll = (target: CommonTypeClass): target is TypeAllTypeClass => {
    return target instanceof TypeTypeClass || target instanceof TypeListTypeClass;
};

export class TypeVisitor extends CommonVisitor<TypeTypeClass<unknown>> {
    visitArraySubscripts(ctx: ArraySubscriptsContext) {
        return ArraySubscriptsTypeClass.create(ctx);
    }

    visitTypeRef(ctx: TypeRefContext) {
        return TypeRefTypeClass.create(ctx);
    }
}
