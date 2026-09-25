import { PropertyDeclarationContext } from '@apexdevtools/apex-parser';

import { IdType, IdVisitor } from '../idVisitor';
import { BlockType, BlockVisitor } from '../blockVisitor';

import { TypeRefType, makeTypeRefType } from '../typeRef';

export type PropertyDeclarationType = {
    type: 'propertyDeclaration';
    propertyType: Omit<TypeRefType, 'type'>;
    propertyName: Omit<IdType, 'type'>;
    propertyBlock: Omit<BlockType, 'type'>[];
};

export const makePropertyDeclarationType = (
    ctx: PropertyDeclarationContext,
): PropertyDeclarationType => {
    const { type: _, ...propertyType } = makeTypeRefType(ctx.typeRef());
    const { type: __, ...propertyName } = new IdVisitor().visit(ctx.id());
    const propertyBlock = ctx.propertyBlock_list().map((block) => {
        const { type: ___, ...blockType } = new BlockVisitor().visit(block);
        return blockType;
    });

    return {
        type: 'propertyDeclaration',
        propertyType,
        propertyName,
        propertyBlock,
    };
};
