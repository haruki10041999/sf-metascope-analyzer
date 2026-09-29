import {
    ApexParserBaseVisitor,
    ArraySubscriptsContext,
    TypeRefContext,
} from '@apexdevtools/apex-parser';

import { ArraySubscriptsTypeClass } from './arraySubscripts';
import { TypeRefType, makeTypeRefType } from './typeRef';

import { CommonTypeClass, ContextTypeClass, CommonVisitor, ErrorTypeClass } from '../commonVisitor';

export { isArraySubscriptsTypeClass } from './arraySubscripts';

export class TypeTypeClass extends ContextTypeClass {
    private variantType: any | null = null;

    constructor(type: string, variantType: any | null, errorClasses: ErrorTypeClass[]) {
        super(type, errorClasses);
        this.variantType = variantType;
    }

    getVariantType(): any | null {
        return this.variantType;
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
        console.log('解析を開始します。' + 'TypeRefContext:  ' + ctx.getText());
        const result = makeTypeRefType(ctx);
        console.log(
            '------------解析が終了しました--------------' +
                'TypeRefContext:  ' +
                JSON.stringify(result, null, 2),
        );
        return result;
    }
}
