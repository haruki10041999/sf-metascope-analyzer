import { TypeListContext } from '@apexdevtools/apex-parser';
import { TypeType, TypeVisitor } from '../typeVisitor';

export type TypeListType = {
    type: 'typeList';
    list: TypeType[];
};

export const makeTypeListType = (ctx: TypeListContext): TypeListType => {
    if (!ctx.typeRef_list() || ctx.typeRef_list().length === 0) {
        throw new Error('値が異常です。TypeListContext: ' + ctx.getText());
    }

    return {
        type: 'typeList',
        list: ctx.typeRef_list().map((typeRefCtx) => {
            const typeRef = new TypeVisitor().visit(typeRefCtx);
            return typeRef;
        }),
    };
};
