import { PropertyDeclarationContext } from '@apexdevtools/apex-parser';

import { DeclarationTypeClass } from '.';

import { NormalIdTypeClass, IdVisitor, isNormalIdType } from '../idVisitor';
import { PropertyBlockTypeClass, BlockVisitor, isPropertyBlockType } from '../blockVisitor';
import { TypeRefTypeClass, TypeVisitor, isTypeRefType } from '../typeVisitor';
import { ErrorTypeClass, CommonTypeClass, isErrorType } from '../commonVisitor';

export class PropertyDeclarationTypeClass extends DeclarationTypeClass<NormalIdTypeClass> {
    private valueType: TypeRefTypeClass | null = null;
    private block: PropertyBlockTypeClass[] = [];
    private constructor(
        value: NormalIdTypeClass | null,
        valueType: TypeRefTypeClass | null,
        block: PropertyBlockTypeClass[],
        errorClasses: Record<string, ErrorTypeClass>,
    ) {
        super('propertyDeclaration', value, errorClasses);
        this.valueType = valueType;
        this.block = block;
    }

    static create(ctx: PropertyDeclarationContext): PropertyDeclarationTypeClass {
        if (!ctx.typeRef() || !ctx.id()) {
            throw new Error('値が異常です。PropertyDeclarationContext: ' + ctx.getText());
        }

        let value: NormalIdTypeClass | null = null;
        let valueType: TypeRefTypeClass | 'void' | null = null;
        let block: PropertyBlockTypeClass[] = [];
        const errorClasses: Record<string, ErrorTypeClass> = {};

        const idTypeClass = new IdVisitor().visit(ctx.id());
        if (isNormalIdType(idTypeClass)) {
            value = idTypeClass;
        } else if (isErrorType(idTypeClass)) {
            errorClasses['value'] = idTypeClass;
        }

        const typeTypeClass = new TypeVisitor().visit(ctx.typeRef());
        if (isTypeRefType(typeTypeClass)) {
            valueType = typeTypeClass;
        } else if (isErrorType(typeTypeClass)) {
            errorClasses['valueType'] = typeTypeClass;
        }

        if (ctx.propertyBlock_list() && ctx.propertyBlock_list().length > 0) {
            ctx.propertyBlock_list().forEach((propertyBlockCtx, index) => {
                const blockTypeClass = new BlockVisitor().visit(propertyBlockCtx);
                if (isPropertyBlockType(blockTypeClass)) {
                    block.push(blockTypeClass);
                } else if (isErrorType(blockTypeClass)) {
                    errorClasses[`block_${index}`] = blockTypeClass;
                }
            });
        }

        return new PropertyDeclarationTypeClass(value, valueType, block, errorClasses);
    }
}

export const isPropertyDeclarationTypeClass = (
    target: CommonTypeClass,
): target is PropertyDeclarationTypeClass => {
    return target instanceof PropertyBlockTypeClass;
};
