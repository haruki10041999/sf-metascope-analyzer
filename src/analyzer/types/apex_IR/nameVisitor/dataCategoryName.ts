import { DataCategoryNameContext } from '@apexdevtools/apex-parser';

import { NameListTypeClass } from '../nameVisitor';

import { SoqlIdTypeClass, isSoqlIdType, IdVisitor } from '../idVisitor';

import { ApexErrorTypeClass, ApexCommonTypeClass, isApexValidClassList } from '../commonVisitor';

export class DataCategoryNameTypeClass extends NameListTypeClass<
    'dataCategoryName',
    SoqlIdTypeClass
> {
    private constructor(value: (SoqlIdTypeClass | ApexErrorTypeClass)[]) {
        super('dataCategoryName', value);
    }

    static create(ctx: DataCategoryNameContext): DataCategoryNameTypeClass {
        if (!ctx.soqlId_list() || ctx.soqlId_list().length === 0) {
            throw new Error('値が異常です。DataCategoryNameContext: ' + ctx.getText());
        }

        return new DataCategoryNameTypeClass(
            isApexValidClassList(
                ctx.soqlId_list(),
                (ctx) => new IdVisitor().visit(ctx),
                isSoqlIdType,
                'soqlId',
            ),
        );
    }
}

export const isDataCategoryNameType = (
    target: ApexCommonTypeClass<string>,
): target is DataCategoryNameTypeClass => {
    return target instanceof DataCategoryNameTypeClass;
};
