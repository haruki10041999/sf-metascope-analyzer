import { ArraySubscriptsContext, TypeRefContext } from '@apexdevtools/apex-parser';

import { ArraySubscriptsTypeClass } from './arraySubscripts';
import { TypeRefTypeClass } from './typeRef';

import { CommonTypeClass, ContextTypeClass, CommonVisitor, ErrorTypeClass } from '../commonVisitor';

export { isArraySubscriptsType, ArraySubscriptsTypeClass } from './arraySubscripts';
export { isTypeRefType, TypeRefTypeClass } from './typeRef';

export class TypeTypeClass<T> extends ContextTypeClass<T> {
    constructor(type: string, value: T | ErrorTypeClass) {
        super(type, value);
    }
}

export const isTypeTypeAll = (target: CommonTypeClass): target is TypeTypeClass<unknown> => {
    return target instanceof TypeTypeClass;
};

export class TypeVisitor extends CommonVisitor<TypeTypeClass<unknown>> {
    visitArraySubscripts(ctx: ArraySubscriptsContext) {
        return ArraySubscriptsTypeClass.create(ctx);
    }

    visitTypeRef(ctx: TypeRefContext) {
        return TypeRefTypeClass.create(ctx);
    }
}
