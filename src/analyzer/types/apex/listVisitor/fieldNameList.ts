import { FieldNameListContext } from '@apexdevtools/apex-parser';

import { NameType, NameVisitor } from '../nameVisitor';

export type FieldNameListType = {
    type: 'fieldNameList';
    list: Omit<NameType, 'type'>[];
};

export const makeFieldNameListType = (ctx: FieldNameListContext): FieldNameListType => {
    const list = ctx.fieldName_list().map((fieldNameCtx) => {
        const { type, ...fieldName } = new NameVisitor().visit(fieldNameCtx);

        return fieldName;
    });

    return {
        type: 'fieldNameList',
        list: list,
    };
};
