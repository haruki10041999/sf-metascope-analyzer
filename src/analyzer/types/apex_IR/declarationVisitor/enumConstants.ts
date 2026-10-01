import { EnumConstantsContext } from '@apexdevtools/apex-parser';

import { DeclarationTypeClass } from '.';

import { NormalIdTypeClass, IdVisitor, isNormalIdType } from '../idVisitor';
import { ErrorTypeClass, CommonTypeClass, isErrorType } from '../commonVisitor';

export class EnumConstantsTypeClass extends DeclarationTypeClass<NormalIdTypeClass[]> {
    private constructor(value: NormalIdTypeClass[], errorClasses: Record<string, ErrorTypeClass>) {
        super('enumConstants', value, errorClasses);
    }

    static create(ctx: EnumConstantsContext): EnumConstantsTypeClass {
        if (!ctx.id_list() || ctx.id_list().length === 0) {
            throw new Error('値が異常です。EnumConstantsContext: ' + ctx.getText());
        }

        const value: NormalIdTypeClass[] = [];
        const errorClasses: Record<string, ErrorTypeClass> = {};

        ctx.id_list().forEach((idCtx, index) => {
            const idTypeClass = new IdVisitor().visit(idCtx);
            if (isNormalIdType(idTypeClass)) {
                value.push(idTypeClass);
            } else if (isErrorType(idTypeClass)) {
                errorClasses[`value_${index}`] = idTypeClass;
            }
        });

        return new EnumConstantsTypeClass(value, errorClasses);
    }
}

export const isEnumConstantsType = (target: CommonTypeClass): target is EnumConstantsTypeClass => {
    return target instanceof EnumConstantsTypeClass;
};
