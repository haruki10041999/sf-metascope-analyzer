import { DataCategoryNameContext } from '@apexdevtools/apex-parser';

import { NameTypeClass } from '../nameVisitor';

import { NormalIdTypeClass, isNormalIdType, IdVisitor } from '../idVisitor';

import { ErrorTypeClass, CommonTypeClass } from '../commonVisitor';

export class DataCategoryNameTypeClass extends NameTypeClass {
    private constructor(value: NormalIdTypeClass[], errorClasses: Record<string, ErrorTypeClass>) {
        super('dataCategoryName', value, errorClasses);
    }

    static create(ctx: DataCategoryNameContext): DataCategoryNameTypeClass {
        if (!ctx.soqlId_list() || ctx.soqlId_list().length === 0) {
            throw new Error('値が異常です。DataCategoryNameContext: ' + ctx.getText());
        }

        const value: NormalIdTypeClass[] = [];
        const errorClasses: Record<string, ErrorTypeClass> = {};

        ctx.soqlId_list().forEach((idCtx, index) => {
            const normalIdTypeClass = new IdVisitor().visit(idCtx);
            if (isNormalIdType(normalIdTypeClass)) {
                value.push(normalIdTypeClass);
            } else {
                errorClasses[`value_${index}`] = normalIdTypeClass;
            }
        });

        return new DataCategoryNameTypeClass(value, errorClasses);
    }
}

export const isDataCategoryNameType = (
    target: CommonTypeClass,
): target is DataCategoryNameTypeClass => {
    return target instanceof DataCategoryNameTypeClass;
};
