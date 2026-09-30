import { TypeListContext } from '@apexdevtools/apex-parser';

import { ListTypeClass } from '../listVisitor';

import { TypeRefTypeClass, TypeVisitor, isTypeTypeAll, isTypeRefType } from '../typeVisitor';

import { ErrorTypeClass, CommonTypeClass, isErrorType } from '../commonVisitor';

export class TypeListTypeClass extends ListTypeClass {
    private constructor(value: TypeRefTypeClass[], errorClasses: Record<string, ErrorTypeClass>) {
        super('typeList', value, errorClasses);
    }

    static create(ctx: TypeListContext): TypeListTypeClass {
        if (!ctx.typeRef_list() || ctx.typeRef_list().length === 0) {
            throw new Error('値が異常です。TypeListContext: ' + ctx.getText());
        }

        const value: TypeRefTypeClass[] = [];
        const errorClasses: Record<string, ErrorTypeClass> = {};

        ctx.typeRef_list().forEach((typeRefCtx, index) => {
            const typeRefTypeClass = new TypeVisitor().visit(typeRefCtx);

            if (isTypeRefType(typeRefTypeClass)) {
                value.push(typeRefTypeClass);
            } else if (isErrorType(typeRefTypeClass)) {
                errorClasses[`value_${index}`] = typeRefTypeClass;
            }
        });

        return new TypeListTypeClass(value, errorClasses);
    }
}

export const isTypeListType = (target: CommonTypeClass): target is TypeListTypeClass => {
    return target instanceof TypeListTypeClass;
};
