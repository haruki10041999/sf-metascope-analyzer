import { PropertyDeclarationContext } from '@apexdevtools/apex-parser';

import { DeclarationTypeClass } from '.';

import { NormalIdTypeClass, IdVisitor, isNormalIdType } from '../idVisitor';
import { PropertyBlockTypeClass, BlockVisitor, isPropertyBlockType } from '../blockVisitor';
import { TypeRefTypeClass, TypeVisitor, isTypeRefType } from '../typeVisitor';
import {
    ApexErrorTypeClass,
    ApexCommonTypeClass,
    isApexValidClass,
    isApexValidClassList,
} from '../commonVisitor';

export class PropertyDeclarationTypeClass extends DeclarationTypeClass<
    'propertyDeclaration',
    NormalIdTypeClass
> {
    private valueType: TypeRefTypeClass | ApexErrorTypeClass;
    private block: (PropertyBlockTypeClass | ApexErrorTypeClass)[] = [];
    private constructor(
        value: NormalIdTypeClass | ApexErrorTypeClass,
        valueType: TypeRefTypeClass | ApexErrorTypeClass,
        block: (PropertyBlockTypeClass | ApexErrorTypeClass)[],
    ) {
        super('propertyDeclaration', value);
        this.valueType = valueType;
        this.block = block;
    }

    static create(ctx: PropertyDeclarationContext): PropertyDeclarationTypeClass {
        if (!ctx.typeRef() || !ctx.id()) {
            throw new Error('値が異常です。PropertyDeclarationContext: ' + ctx.getText());
        }

        return new PropertyDeclarationTypeClass(
            isApexValidClass(new IdVisitor().visit(ctx.id()), isNormalIdType, 'id'),
            isApexValidClass(new TypeVisitor().visit(ctx.typeRef()), isTypeRefType, 'typeRef'),
            isApexValidClassList(
                ctx.propertyBlock_list(),
                (ctx) => new BlockVisitor().visit(ctx),
                isPropertyBlockType,
                'propertyBlock',
            ),
        );
    }

    getValueType(): TypeRefTypeClass | ApexErrorTypeClass {
        return this.valueType;
    }

    getBlock(): (PropertyBlockTypeClass | ApexErrorTypeClass)[] {
        return this.block;
    }
}

export const isPropertyDeclarationType = (
    target: ApexCommonTypeClass<string>,
): target is PropertyDeclarationTypeClass => {
    return target instanceof PropertyDeclarationTypeClass;
};
