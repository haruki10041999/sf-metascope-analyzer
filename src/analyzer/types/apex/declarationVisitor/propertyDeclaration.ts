import { PropertyDeclarationContext } from '@apexdevtools/apex-parser';

import { IdType, IdVisitor } from '../idVisitor';
import { BlockType, BlockVisitor } from '../blockVisitor';
import { TypeType, TypeVisitor } from '../typeVisitor';

export type PropertyDeclarationType = {
    type: 'propertyDeclaration';
    declaration: {
        type: TypeType;
        name: IdType;
        block: BlockType[];
    };
};

export const makePropertyDeclarationType = (
    ctx: PropertyDeclarationContext,
): PropertyDeclarationType => {
    const propertyType = new TypeVisitor().visit(ctx.typeRef());
    const propertyName = new IdVisitor().visit(ctx.id());
    const propertyBlock = ctx.propertyBlock_list().map((block) => {
        const blockType = new BlockVisitor().visit(block);
        return blockType;
    });

    return {
        type: 'propertyDeclaration',
        declaration: {
            type: propertyType,
            name: propertyName,
            block: propertyBlock,
        },
    };
};
