import { FromNameListContext } from '@apexdevtools/apex-parser';

import { NameType, NameVisitor } from '../nameVisitor';
import { IdType, IdVisitor } from '../idVisitor';

export type FromNameListType = {
    type: 'fromNameList';
    list: (NameType | IdType)[];
};

export const makeFromNameListType = (ctx: FromNameListContext): FromNameListType => {
    if (
        (!ctx.fieldName_list() || ctx.fieldName_list().length === 0) &&
        (!ctx.soqlId_list() || ctx.soqlId_list().length === 0)
    ) {
        throw new Error('値が異常です。FromNameListContext: ' + ctx.getText());
    }

    const list: (NameType | IdType)[] = [];

    if (ctx.fieldName_list() && ctx.fieldName_list().length > 0) {
        list.push(
            ...ctx.fieldName_list().map((fieldNameCtx) => {
                const fieldName = new NameVisitor().visit(fieldNameCtx);
                return fieldName;
            }),
        );
    }

    if (ctx.soqlId_list() && ctx.soqlId_list().length > 0) {
        list.push(
            ...ctx.soqlId_list().map((soqlIdCtx) => {
                const soqlId = new IdVisitor().visit(soqlIdCtx);
                return soqlId;
            }),
        );
    }

    return {
        type: 'fromNameList',
        list: list,
    };
};

