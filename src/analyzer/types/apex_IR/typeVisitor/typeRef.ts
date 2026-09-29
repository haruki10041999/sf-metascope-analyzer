import { TypeRefContext } from '@apexdevtools/apex-parser';

import { NameType, NameVisitor } from '../nameVisitor';
import { TypeType, TypeVisitor } from '.';

export type TypeRefType = {
    type: 'typeRef';
    variantType: {
        name: NameType[];
        array?: TypeType;
    };
};

export const makeTypeRefType = (ctx: TypeRefContext): TypeRefType => {
    if (!ctx.typeName_list() || ctx.typeName_list().length === 0) {
        throw new Error('値が異常です。TypeRefContext: ' + ctx.getText());
    }

    const typeNames = ctx.typeName_list().map((typeNameCtx) => {
        const nest = new NameVisitor().visit(typeNameCtx);
        return nest;
    });

    const typeRefType: TypeRefType = {
        type: 'typeRef',
        variantType: {
            name: typeNames,
        },
    };

    if (ctx.arraySubscripts()) {
        const nest = new TypeVisitor().visit(ctx.arraySubscripts());
        typeRefType.variantType.array = nest;
    }

    return typeRefType;
};
