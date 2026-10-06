import { FieldDeclarationContext } from '@apexdevtools/apex-parser';

import { DeclarationTypeClass } from '.';

import { TypeRefTypeClass, TypeVisitor, isTypeRefType } from '../typeVisitor';
import {
    VariableDeclaratorsTypeClass,
    VariableVisitor,
    isVariableDeclaratorsType,
} from '../variableVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClass } from '../commonVisitor';

export class FieldDeclarationTypeClass extends DeclarationTypeClass<VariableDeclaratorsTypeClass> {
    private valueType: TypeRefTypeClass | ErrorTypeClass;

    private constructor(
        value: VariableDeclaratorsTypeClass | ErrorTypeClass,
        valueType: TypeRefTypeClass | ErrorTypeClass,
    ) {
        super('fieldDeclaration', value);
        this.valueType = valueType;
    }

    static create(ctx: FieldDeclarationContext): FieldDeclarationTypeClass {
        if (!ctx.typeRef() || !ctx.variableDeclarators()) {
            throw new Error('値が異常です。FieldDeclarationContext: ' + ctx.getText());
        }

        return new FieldDeclarationTypeClass(
            isValidClass(
                new VariableVisitor().visit(ctx.variableDeclarators()),
                isVariableDeclaratorsType,
                'variableDeclarators',
            ),
            isValidClass(new TypeVisitor().visit(ctx.typeRef()), isTypeRefType, 'typeRef'),
        );
    }

    getValueType(): TypeRefTypeClass | ErrorTypeClass {
        return this.valueType;
    }
}

export const isFieldDeclarationType = (
    target: CommonTypeClass,
): target is FieldDeclarationTypeClass => {
    return target instanceof FieldDeclarationTypeClass;
};
