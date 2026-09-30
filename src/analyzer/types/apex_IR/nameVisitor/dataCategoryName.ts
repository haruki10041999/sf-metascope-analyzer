import { DataCategoryNameContext } from '@apexdevtools/apex-parser';

import { NameTypeClass } from '../nameVisitor';

import { SoqlIdTypeClass, isSoqlIdType, IdVisitor } from '../idVisitor';

import { ErrorTypeClass, CommonTypeClass, isErrorType } from '../commonVisitor';

export class DataCategoryNameTypeClass extends NameTypeClass<SoqlIdTypeClass[]> {
    private constructor(value: SoqlIdTypeClass[], errorClasses: Record<string, ErrorTypeClass>) {
        super('dataCategoryName', value, errorClasses);
    }

    static create(ctx: DataCategoryNameContext): DataCategoryNameTypeClass {
        if (!ctx.soqlId_list() || ctx.soqlId_list().length === 0) {
            throw new Error('値が異常です。DataCategoryNameContext: ' + ctx.getText());
        }

        const value: SoqlIdTypeClass[] = [];
        const errorClasses: Record<string, ErrorTypeClass> = {};

        ctx.soqlId_list().forEach((idCtx, index) => {
            const idTypeClass = new IdVisitor().visit(idCtx);
            if (isSoqlIdType(idTypeClass)) {
                value.push(idTypeClass);
            } else if (isErrorType(idTypeClass)) {
                errorClasses[`value_${index}`] = idTypeClass;
            } else {
                throw new Error(
                    '想定したタイプと違います　想定：soqlId、実値：' + idTypeClass.getType(),
                );
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
