import { TypeRefContext } from '@apexdevtools/apex-parser';

import { TypeNameTypeClass, NameVisitor, isTypeNameType } from '../nameVisitor';
import {
    ApexErrorTypeClass,
    ApexCommonTypeClass,
    visitNodeList,
    visitNode,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { ArraySubscriptsTypeClass } from '../../apex_IR/typeVisitor';
import { TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type TypeRefType = TypeField<'typeRef'> & {
    element: TypeNameTypeClass[];
    dimention: ArraySubscriptsTypeClass;
};

export class TypeRefTypeClass extends ApexCommonTypeClass<'typeRef', TypeRefType> {
    private constructor(
        element: TypeNameTypeClass[],
        dimention: ArraySubscriptsTypeClass,
        sourceSpan: SourceSpan,
    ) {
        super('typeRef', { element: element, dimention: dimention }, sourceSpan);
    }

    static create(ctx: TypeRefContext): TypeRefTypeClass {
        return new TypeRefTypeClass(
            ctx.typeName_list().map((t) => TypeNameTypeClass.create(t)),
            ArraySubscriptsTypeClass.create(ctx.arraySubscripts()),
            getSourceSpan(ctx),
        );
    }
}

export const isTypeRefType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is TypeRefTypeClass => {
    return isSpicifyApexCommonTypeClass('typeRef', target);
};
