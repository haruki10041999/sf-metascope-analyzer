import { TypeRefContext } from '@apexdevtools/apex-parser';

import { NameType, NameVisitor } from './nameVisitor';

import { ArraySubscriptsType, makeArraySubscriptsType } from './arraySubscripts';

export type TypeRefType = {
    type: 'typeRef';
    variantType: Omit<NameType, 'type'>[];
    array?: Omit<ArraySubscriptsType, 'type'>;
};

export const makeTypeRefType = (ctx: TypeRefContext): TypeRefType => {
    const typeNames = ctx.typeName_list().map((typeNameCtx) => {
        const { type, ...nest } = new NameVisitor().visit(typeNameCtx);
        return nest;
    });

    const typeRefType: TypeRefType = {
        type: 'typeRef',
        variantType: typeNames,
    };

    if (ctx.arraySubscripts()) {
        const { type, ...nest } = makeArraySubscriptsType(ctx.arraySubscripts());
        typeRefType.array = nest;
    }

    return typeRefType;
};
