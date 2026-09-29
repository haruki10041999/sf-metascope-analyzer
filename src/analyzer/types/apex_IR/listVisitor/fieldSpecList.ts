import { FieldSpecListContext } from '@apexdevtools/apex-parser';

import { ListType, ListVisitor } from '.';
import { QueryType, QueryVisitor } from '../queryVisitor';

export type FieldSpecListType = {
    type: 'fieldSpecList';
    list: QueryType[];
};

export const makeFieldSpecListType = (ctx: FieldSpecListContext): FieldSpecListType => {
    if (!ctx.fieldSpec()) {
        throw new Error('値が異常です。FieldSpecListContext: ' + ctx.getText());
    }

    const list: QueryType[] = [];

    list.push(new QueryVisitor().visit(ctx.fieldSpec()));

    if (ctx.fieldSpecList_list() && ctx.fieldSpecList_list().length > 0) {
        ctx.fieldSpecList_list().forEach((nestedCtx) => {
            const fieldSpecList = new ListVisitor().visit(nestedCtx);
            if (fieldSpecList.type === 'fieldSpecList') {
                list.push(...fieldSpecList.list);
            }
        });
    }

    return {
        type: 'fieldSpecList',
        list: list,
    };
};

