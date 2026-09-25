import { TypeNameContext } from '@apexdevtools/apex-parser';

import { ArgumentsType, ArgumentsVisitor } from '../argumentsVisitor';
import { IdType, IdVisitor } from '../idVisitor';

export type TypeNameType = {
    type: 'typeName';
    name: Omit<IdType, 'type'>;
    collection: 'list' | 'set' | 'map' | null;
    generic?: Omit<ArgumentsType, 'type'>;
};

export const makeTypeNameType = (ctx: TypeNameContext): TypeNameType => {
    const { type, ...value } = new IdVisitor().visit(ctx.id());

    if ((ctx.LIST() || ctx.SET() || ctx.MAP()) && ctx.typeArguments()) {
        const generic = new ArgumentsVisitor().visit(ctx.typeArguments());
        if (ctx.LIST()) {
            return {
                type: 'typeName',
                name: value,
                collection: 'list',
                generic,
            };
        }
        if (ctx.SET()) {
            return {
                type: 'typeName',
                name: value,
                collection: 'set',
                generic,
            };
        }
        if (ctx.MAP()) {
            return {
                type: 'typeName',
                name: value,
                collection: 'map',
                generic,
            };
        }
    }

    return {
        type: 'typeName',
        name: value,
        collection: null,
    };
};
