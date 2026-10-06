import { PropertyDeclarationContext } from '@apexdevtools/apex-parser';

import { DeclarationTypeClass } from '.';

import { NormalIdTypeClass, IdVisitor, isNormalIdType } from '../idVisitor';
import { PropertyBlockTypeClass, BlockVisitor, isPropertyBlockType } from '../blockVisitor';
import { TypeRefTypeClass, TypeVisitor, isTypeRefType } from '../typeVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClass, isValidClassList } from '../commonVisitor';
import { get } from 'http';

export class PropertyDeclarationTypeClass extends DeclarationTypeClass<NormalIdTypeClass> {
    private valueType: TypeRefTypeClass | ErrorTypeClass;
    private block: (PropertyBlockTypeClass | ErrorTypeClass)[] = [];
    private constructor(
        value: NormalIdTypeClass | ErrorTypeClass,
        valueType: TypeRefTypeClass | ErrorTypeClass,
        block: (PropertyBlockTypeClass | ErrorTypeClass)[],
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
            isValidClass(new IdVisitor().visit(ctx.id()), isNormalIdType, 'id'),
            isValidClass(new TypeVisitor().visit(ctx.typeRef()), isTypeRefType, 'typeRef'),
            isValidClassList(
                ctx.propertyBlock_list(),
                (ctx) => new BlockVisitor().visit(ctx),
                isPropertyBlockType,
                'propertyBlock',
            ),
        );
    }

    getValueType(): TypeRefTypeClass | ErrorTypeClass {
        return this.valueType;
    }

    getBlock(): (PropertyBlockTypeClass | ErrorTypeClass)[] {
        return this.block;
    }
}

export const isPropertyDeclarationType = (
    target: CommonTypeClass,
): target is PropertyDeclarationTypeClass => {
    return target instanceof PropertyDeclarationTypeClass;
};
