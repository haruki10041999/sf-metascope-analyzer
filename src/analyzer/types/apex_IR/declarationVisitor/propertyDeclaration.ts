import { PropertyDeclarationContext } from '@apexdevtools/apex-parser';

import { IdTypeClass } from '../idVisitor';
import { PropertyBlockTypeClass } from '../blockVisitor';
import { TypeRefTypeClass } from '../typeVisitor';
import {
    ApexCommonTypeClass,
    createNode,
    createNodeList,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type PropertyDeclarationType = TypeField<'propertyDeclaration'> & {
    valueType: TypeRefTypeClass;
    name: IdTypeClass;
    blocks: PropertyBlockTypeClass[];
};

export class PropertyDeclarationTypeClass extends ApexCommonTypeClass<
    'propertyDeclaration',
    PropertyDeclarationType
> {
    private constructor(fields: FieldsOf<PropertyDeclarationType>, sourceSpan: SourceSpan) {
        super('propertyDeclaration', fields, sourceSpan);
    }

    static create(ctx: PropertyDeclarationContext): PropertyDeclarationTypeClass {
        return new PropertyDeclarationTypeClass(
            {
                valueType: createNode(ctx.typeRef(), (c) => TypeRefTypeClass.create(c), 'typeRef'),
                name: createNode(ctx.id(), (c) => IdTypeClass.create(c), 'id'),
                blocks: createNodeList(
                    ctx.propertyBlock_list(),
                    (c) => PropertyBlockTypeClass.create(c),
                    'propertyBlock',
                ),
            },
            getSourceSpan(ctx),
        );
    }

    getValueType(): PropertyDeclarationType['valueType'] {
        return this.getFields().valueType;
    }

    getName(): PropertyDeclarationType['name'] {
        return this.getFields().name;
    }

    getBlocks(): PropertyDeclarationType['blocks'] {
        return this.getFields().blocks;
    }
}

export const isPropertyDeclarationType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is PropertyDeclarationTypeClass => {
    return isSpicifyApexCommonTypeClass('propertyDeclaration', target);
};
