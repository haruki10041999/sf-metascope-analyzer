import { FieldNameListContext } from '@apexdevtools/apex-parser';

import { ListTypeClass } from '.';

import { FieldNameTypeClass, NameVisitor, isFieldNameType } from '../nameVisitor';
import { ApexErrorTypeClass, ApexCommonTypeClass, isApexValidClassList } from '../commonVisitor';

export class FieldNameListTypeClass extends ListTypeClass<'fieldNameList', FieldNameTypeClass> {
    private constructor(value: (FieldNameTypeClass | ApexErrorTypeClass)[]) {
        super('fieldNameList', value);
    }

    static create(ctx: FieldNameListContext) {
        if (!ctx.fieldName_list() || ctx.fieldName_list().length === 0) {
            throw new Error('値が異常です。FieldNameListContext: ' + ctx.getText());
        }

        return new FieldNameListTypeClass(
            isApexValidClassList(
                ctx.fieldName_list(),
                (ctx) => new NameVisitor().visit(ctx),
                isFieldNameType,
                'fieldName',
            ),
        );
    }
}

export const isFieldNameListType = (
    target: ApexCommonTypeClass<string>,
): target is FieldNameListTypeClass => {
    return target instanceof FieldNameListTypeClass;
};

