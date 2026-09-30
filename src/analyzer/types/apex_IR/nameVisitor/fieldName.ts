import { FieldNameContext } from '@apexdevtools/apex-parser';

import { NameTypeClass } from '.';

import { SoqlIdTypeClass, IdVisitor, isSoqlIdType } from '../idVisitor';
import { ErrorTypeClass, CommonTypeClass } from '../commonVisitor';

export class FieldNameTypeClass extends NameTypeClass {
    private constructor(value: SoqlIdTypeClass[], errorClasses: Record<string, ErrorTypeClass>) {
        super('fieldName', value, errorClasses);
    }

    static create(ctx: FieldNameContext): FieldNameTypeClass {
        if (!ctx.soqlId_list() || ctx.soqlId_list().length === 0) {
            throw new Error('値が異常です。FieldNameContext: ' + ctx.getText());
        }

        const value: SoqlIdTypeClass[] = [];
        const errorClasses: Record<string, ErrorTypeClass> = {};

        ctx.soqlId_list().forEach((idCtx, index) => {
            const soqlIdTypeClass = new IdVisitor().visit(idCtx);
            if (isSoqlIdType(soqlIdTypeClass)) {
                value.push(soqlIdTypeClass);
            } else {
                errorClasses[`value_${index}`] = soqlIdTypeClass;
            }
        });

        return new FieldNameTypeClass(value, errorClasses);
    }
}

export const isFieldNameType = (target: CommonTypeClass): target is FieldNameTypeClass => {
    return target instanceof FieldNameTypeClass;
};
