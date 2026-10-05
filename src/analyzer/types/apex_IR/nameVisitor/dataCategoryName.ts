import { DataCategoryNameContext } from '@apexdevtools/apex-parser';

import { NameListTypeClass } from '../nameVisitor';

import { SoqlIdTypeClass, isSoqlIdType, IdVisitor } from '../idVisitor';

import { ErrorTypeClass, CommonTypeClass, isValidClassList } from '../commonVisitor';

export class DataCategoryNameTypeClass extends NameListTypeClass<SoqlIdTypeClass> {
    private constructor(value: (SoqlIdTypeClass | ErrorTypeClass)[]) {
        super('dataCategoryName', value);
    }

    static create(ctx: DataCategoryNameContext): DataCategoryNameTypeClass {
        if (!ctx.soqlId_list() || ctx.soqlId_list().length === 0) {
            throw new Error('値が異常です。DataCategoryNameContext: ' + ctx.getText());
        }

        return new DataCategoryNameTypeClass(
            isValidClassList(
                ctx.soqlId_list(),
                (ctx) => new IdVisitor().visit(ctx),
                isSoqlIdType,
                'soqlId',
            ),
        );
    }
}

export const isDataCategoryNameType = (
    target: CommonTypeClass,
): target is DataCategoryNameTypeClass => {
    return target instanceof DataCategoryNameTypeClass;
};
