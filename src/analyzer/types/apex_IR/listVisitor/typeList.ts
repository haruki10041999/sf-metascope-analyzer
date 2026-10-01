import { TypeListContext } from '@apexdevtools/apex-parser';

import { ListTypeClass } from '../listVisitor';

import { TypeRefTypeClass, TypeVisitor, isTypeRefType } from '../typeVisitor';

import { ErrorTypeClass, CommonTypeClass, isErrorType } from '../commonVisitor';

export class TypeListTypeClass extends ListTypeClass<TypeRefTypeClass[]> {
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
            const typeTypeclass = new TypeVisitor().visit(typeRefCtx);

            if (isTypeRefType(typeTypeclass)) {
                value.push(typeTypeclass);
            } else if (isErrorType(typeTypeclass)) {
                errorClasses[`value_${index}`] = typeTypeclass;
            }
        });

        return new TypeListTypeClass(value, errorClasses);
    }
}

export const isTypeListType = (target: CommonTypeClass): target is TypeListTypeClass => {
    return target instanceof TypeListTypeClass;
};
