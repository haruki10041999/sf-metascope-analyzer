import { FieldNameListContext } from '@apexdevtools/apex-parser';

import { NameType, NameVisitor } from '../nameVisitor';

export type FieldNameListType = {
    type: 'fieldNameList';
    list: NameType[];
};

export const makeFieldNameListType = (ctx: FieldNameListContext): FieldNameListType => {
    const list = ctx.fieldName_list().map((fieldNameCtx) => {
        const fieldName = new NameVisitor().visit(fieldNameCtx);

        return fieldName;
    });

    return {
        type: 'fieldNameList',
        list: list,
    };
};

