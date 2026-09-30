import {
    ApexParserBaseVisitor,
    ArraySubscriptsContext,
    TypeRefContext,
} from '@apexdevtools/apex-parser';

import { ArraySubscriptsTypeClass } from './arraySubscripts';
import { TypeRefTypeClass } from './typeRef';

import { CommonTypeClass, ContextTypeClass, CommonVisitor, ErrorTypeClass } from '../commonVisitor';

export { isArraySubscriptsType, ArraySubscriptsTypeClass } from './arraySubscripts';
export { isTypeRefType, TypeRefTypeClass } from './typeRef';

export class TypeTypeClass extends ContextTypeClass {
    constructor(type: string, value: any | null, errorClasses: Record<string, ErrorTypeClass>) {
        super(type, value, errorClasses);
    }
}

export const isTypeTypeAll = (target: CommonTypeClass): target is TypeTypeClass => {
    return target instanceof TypeTypeClass;
};

export class TypeVisitor extends CommonVisitor<TypeTypeClass> {
    visitArraySubscripts(ctx: ArraySubscriptsContext) {
        return ArraySubscriptsTypeClass.create(ctx);
    }

    visitTypeRef(ctx: TypeRefContext) {
        return TypeRefTypeClass.create(ctx);
    }
}
