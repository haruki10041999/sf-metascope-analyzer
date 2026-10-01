import { FieldNameListContext } from '@apexdevtools/apex-parser';

import { ListTypeClass } from '.';

import { FieldNameTypeClass, NameVisitor, isFieldNameType } from '../nameVisitor';
import { ErrorTypeClass, CommonTypeClass, isErrorType } from '../commonVisitor';

export class FieldNameListTypeClass extends ListTypeClass<FieldNameTypeClass[]> {
    private constructor(value: FieldNameTypeClass[], errorClasses: Record<string, ErrorTypeClass>) {
        super('fieldNameList', value, errorClasses);
    }

    static create(ctx: FieldNameListContext) {
        if (!ctx.fieldName_list() || ctx.fieldName_list().length === 0) {
            throw new Error('値が異常です。FieldNameListContext: ' + ctx.getText());
        }

        const value: FieldNameTypeClass[] = [];
        const errorClasses: Record<string, ErrorTypeClass> = {};

        ctx.fieldName_list().forEach((fieldNameCtx, index) => {
            const nameTypeClass = new NameVisitor().visit(fieldNameCtx);

            if (isFieldNameType(nameTypeClass)) {
                value.push(nameTypeClass);
            } else if (isErrorType(nameTypeClass)) {
                errorClasses[`value_${index}`] = nameTypeClass;
            }
        });

        return new FieldNameListTypeClass(value, errorClasses);
    }
}

export const isFieldNameListType = (target: CommonTypeClass): target is FieldNameListTypeClass => {
    return target instanceof FieldNameListTypeClass;
};

