import { FieldGroupByContext } from '@apexdevtools/apex-parser';

import { ClauseTypeClass } from '.';

import { SoqlFunctionTypeClass, QueryVisitor, isSoqlFunctionType } from '../queryVisitor';
import { FieldNameTypeClass, NameVisitor, isFieldNameType } from '../nameVisitor';
import { ApexErrorTypeClass, ApexCommonTypeClass, visitNode } from '../commonVisitor';

export class FieldGroupByTypeClass extends ClauseTypeClass<
    'fieldGroupBy',
    FieldNameTypeClass | SoqlFunctionTypeClass
> {
    private constructor(value: FieldNameTypeClass | SoqlFunctionTypeClass | ApexErrorTypeClass) {
        super('fieldGroupBy', value);
    }

    static create(ctx: FieldGroupByContext): FieldGroupByTypeClass {
        if (!ctx.fieldName() && !ctx.soqlFunction()) {
            throw new Error('値が異常です。FieldGroupByContext:' + ctx.getText());
        }

        return new FieldGroupByTypeClass(
            ctx.fieldName()
                ? visitNode(new NameVisitor(), ctx.fieldName(), isFieldNameType, 'fieldName')
                : visitNode(
                      new QueryVisitor(),
                      ctx.soqlFunction(),
                      isSoqlFunctionType,
                      'soqlFunction',
                  ),
        );
    }
}

export const isFieldGroupByType = (
    target: ApexCommonTypeClass<string>,
): target is FieldGroupByTypeClass => {
    return target instanceof FieldGroupByTypeClass;
};
