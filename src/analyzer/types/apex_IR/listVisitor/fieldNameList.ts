import { FieldNameListContext } from '@apexdevtools/apex-parser';

import { ListTypeClass } from '.';

import { FieldNameTypeClass, NameVisitor, isFieldNameType } from '../nameVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClassList } from '../commonVisitor';

export class FieldNameListTypeClass extends ListTypeClass<FieldNameTypeClass> {
    private constructor(value: (FieldNameTypeClass | ErrorTypeClass)[]) {
        super('fieldNameList', value);
    }

    static create(ctx: FieldNameListContext) {
        if (!ctx.fieldName_list() || ctx.fieldName_list().length === 0) {
            throw new Error('値が異常です。FieldNameListContext: ' + ctx.getText());
        }

        return new FieldNameListTypeClass(
            isValidClassList(
                ctx.fieldName_list(),
                (ctx) => new NameVisitor().visit(ctx),
                isFieldNameType,
                'fieldName',
            ),
        );
    }
}

export const isFieldNameListType = (target: CommonTypeClass): target is FieldNameListTypeClass => {
    return target instanceof FieldNameListTypeClass;
};
