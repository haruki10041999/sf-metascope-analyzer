import { FieldNameContext } from '@apexdevtools/apex-parser';

import { NameTypeClass } from '.';

import { SoqlIdTypeClass, IdVisitor, isSoqlIdType } from '../idVisitor';
import { ErrorTypeClass, CommonTypeClass, isErrorType } from '../commonVisitor';

export class FieldNameTypeClass extends NameTypeClass<SoqlIdTypeClass[]> {
    private constructor(value: SoqlIdTypeClass[], errorClasses: Record<string, ErrorTypeClass>) {
        super('fieldName', value, errorClasses);
    }

    static create(ctx: FieldNameContext): FieldNameTypeClass {
        if (!ctx.soqlId_list() || ctx.soqlId_list().length === 0) {
            throw new Error('値が異常です。FieldNameContext: ' + ctx.getText());
        }

        const value: SoqlIdTypeClass[] = [];
        const errorClasses: Record<string, ErrorTypeClass> = {};

        ctx.soqlId_list().forEach((SoqlIdCtx, index) => {
            const idTypeClass = new IdVisitor().visit(SoqlIdCtx);
            if (isSoqlIdType(idTypeClass)) {
                value.push(idTypeClass);
            } else if (isErrorType(idTypeClass)) {
                errorClasses[`value_${index}`] = idTypeClass;
            }
        });

        return new FieldNameTypeClass(value, errorClasses);
    }
}

export const isFieldNameType = (target: CommonTypeClass): target is FieldNameTypeClass => {
    return target instanceof FieldNameTypeClass;
};
