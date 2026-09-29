import { PropertyDeclarationContext } from '@apexdevtools/apex-parser';

import { IdType, IdVisitor } from '../idVisitor';
import { BlockType, BlockVisitor } from '../blockVisitor';
import { TypeType, TypeVisitor } from '../typeVisitor';

export type PropertyDeclarationType = {
    type: 'propertyDeclaration';
    declaration: {
        type: TypeType;
        name: IdType;
        block?: BlockType[];
    };
};

export const makePropertyDeclarationType = (
    ctx: PropertyDeclarationContext,
): PropertyDeclarationType => {
    if (!ctx.typeRef() || !ctx.id()) {
        throw new Error('値が異常です。PropertyDeclarationContext: ' + ctx.getText());
    }

    const propertyType = new TypeVisitor().visit(ctx.typeRef());
    const propertyName = new IdVisitor().visit(ctx.id());

    const declaration: {
        type: TypeType;
        name: IdType;
        block?: BlockType[];
    } = {
        type: propertyType,
        name: propertyName,
    };

    if (ctx.propertyBlock_list() && ctx.propertyBlock_list().length > 0) {
        declaration.block = ctx.propertyBlock_list().map((block) => {
            const blockType = new BlockVisitor().visit(block);
            return blockType;
        });
    }

    return {
        type: 'propertyDeclaration',
        declaration: declaration,
    };
};
