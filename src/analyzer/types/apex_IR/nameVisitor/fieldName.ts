import { FieldNameContext } from '@apexdevtools/apex-parser';

import { NameListTypeClass } from '.';

import { SoqlIdTypeClass, IdVisitor, isSoqlIdType } from '../idVisitor';
import { ApexErrorTypeClass, ApexCommonTypeClass, visitNodeList } from '../commonVisitor';

export class FieldNameTypeClass extends NameListTypeClass<'fieldName', SoqlIdTypeClass> {
    private constructor(value: (SoqlIdTypeClass | ApexErrorTypeClass)[]) {
        super('fieldName', value);
    }

    static create(ctx: FieldNameContext): FieldNameTypeClass {
        if (!ctx.soqlId_list() || ctx.soqlId_list().length === 0) {
            throw new Error('値が異常です。FieldNameContext: ' + ctx.getText());
        }

        return new FieldNameTypeClass(
            visitNodeList(new IdVisitor(), ctx.soqlId_list(), isSoqlIdType, 'soqlId'),
        );
    }
}

export const isFieldNameType = (
    target: ApexCommonTypeClass<string>,
): target is FieldNameTypeClass => {
    return target instanceof FieldNameTypeClass;
};
