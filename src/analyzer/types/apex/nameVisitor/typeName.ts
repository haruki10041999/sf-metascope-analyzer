import { TypeNameContext } from '@apexdevtools/apex-parser';

import { ArgumentsType, ArgumentsVisitor } from '../argumentsVisitor';
import { IdType, IdVisitor } from '../idVisitor';

export type TypeNameType = {
    type: 'typeName';
    name: { type: 'list' | 'set' | 'map'; generic?: ArgumentsType } | IdType;
};

export const makeTypeNameType = (ctx: TypeNameContext): TypeNameType => {
    if ((ctx.LIST() || ctx.SET() || ctx.MAP()) && ctx.typeArguments()) {
        const generic = new ArgumentsVisitor().visit(ctx.typeArguments());
        if (ctx.LIST()) {
            return {
                type: 'typeName',
                name: {
                    type: 'list',
                    generic,
                },
            };
        }
        if (ctx.SET()) {
            return {
                type: 'typeName',
                name: {
                    type: 'set',
                    generic,
                },
            };
        }
        if (ctx.MAP()) {
            return {
                type: 'typeName',
                name: {
                    type: 'map',
                    generic,
                },
            };
        }
    }

    if (ctx.id()) {
        const type = new IdVisitor().visit(ctx.id());
        return {
            type: 'typeName',
            name: type,
        };
    }

    throw new Error('値が異常です。TypeNameContext: ' + ctx.getText());
};
