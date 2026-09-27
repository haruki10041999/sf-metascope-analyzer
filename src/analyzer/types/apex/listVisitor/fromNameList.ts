import { FromNameListContext, SoqlIdContext } from '@apexdevtools/apex-parser';

import { NameType, NameVisitor } from '../nameVisitor';
import { IdType, IdVisitor } from '../idVisitor';

export type FromNameListType = {
    type: 'fromNameList';
    list: (Omit<NameType, 'type'> | Omit<IdType, 'type'>)[];
};

export const makeFromNameListType = (ctx: FromNameListContext): FromNameListType => {
    const list: (Omit<NameType, 'type'> | Omit<IdType, 'type'>)[] = [];

    if (ctx.fieldName_list() && ctx.fieldName_list().length > 0) {
        list.push(
            ...ctx.fieldName_list().map((fieldNameCtx) => {
                const { type, ...fieldName } = new NameVisitor().visit(fieldNameCtx);
                return fieldName;
            }),
        );
    }

    if (ctx.soqlId_list() && ctx.soqlId_list().length > 0) {
        list.push(
            ...ctx.soqlId_list().map((soqlIdCtx) => {
                const { type, ...soqlId } = new IdVisitor().visit(soqlIdCtx);
                return soqlId;
            }),
        );
    }

    return {
        type: 'fromNameList',
        list: list,
    };
};
