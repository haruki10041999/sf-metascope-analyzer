import { TypeNameContext } from '@apexdevtools/apex-parser';

import { ArgumentsType, ArgumentsVisitor } from '../argumentsVisitor';
import { IdType, IdVisitor } from '../idVisitor';

export type TypeNameType = {
    type: 'typeName';
    name: { name: IdType; collection?: 'list' | 'set' | 'map'; generic?: ArgumentsType };
};

export const makeTypeNameType = (ctx: TypeNameContext): TypeNameType => {
    const value = new IdVisitor().visit(ctx.id());

    if ((ctx.LIST() || ctx.SET() || ctx.MAP()) && ctx.typeArguments()) {
        const generic = new ArgumentsVisitor().visit(ctx.typeArguments());
        if (ctx.LIST()) {
            return {
                type: 'typeName',
                name: {
                    name: value,
                    collection: 'list',
                    generic,
                },
            };
        }
        if (ctx.SET()) {
            return {
                type: 'typeName',
                name: {
                    name: value,
                    collection: 'set',
                    generic,
                },
            };
        }
        if (ctx.MAP()) {
            return {
                type: 'typeName',
                name: {
                    name: value,
                    collection: 'map',
                    generic,
                },
            };
        }
    }

    return {
        type: 'typeName',
        name: { name: value },
    };
};
