import { FieldDeclarationContext } from '@apexdevtools/apex-parser';

import { DeclarationTypeClass } from '.';

import { TypeRefTypeClass, TypeVisitor, isTypeRefType } from '../typeVisitor';
import {
    VariableDeclaratorsTypeClass,
    VariableVisitor,
    isVariableDeclaratorsType,
} from '../variableVisitor';
import { ApexErrorTypeClass, ApexCommonTypeClass, visitNode } from '../commonVisitor';

export class FieldDeclarationTypeClass extends DeclarationTypeClass<
    'fieldDeclaration',
    VariableDeclaratorsTypeClass
> {
    private valueType: TypeRefTypeClass | ApexErrorTypeClass;

    private constructor(
        value: VariableDeclaratorsTypeClass | ApexErrorTypeClass,
        valueType: TypeRefTypeClass | ApexErrorTypeClass,
    ) {
        super('fieldDeclaration', value);
        this.valueType = valueType;
    }

    static create(ctx: FieldDeclarationContext): FieldDeclarationTypeClass {
        if (!ctx.typeRef() || !ctx.variableDeclarators()) {
            throw new Error('値が異常です。FieldDeclarationContext: ' + ctx.getText());
        }

        return new FieldDeclarationTypeClass(
            visitNode(
                new VariableVisitor(),
                ctx.variableDeclarators(),
                isVariableDeclaratorsType,
                'variableDeclarators',
            ),
            visitNode(new TypeVisitor(), ctx.typeRef(), isTypeRefType, 'typeRef'),
        );
    }

    getValueType(): TypeRefTypeClass | ApexErrorTypeClass {
        return this.valueType;
    }
}

export const isFieldDeclarationType = (
    target: ApexCommonTypeClass<string>,
): target is FieldDeclarationTypeClass => {
    return target instanceof FieldDeclarationTypeClass;
};
