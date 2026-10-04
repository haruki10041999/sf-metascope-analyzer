import { FieldDeclarationContext } from '@apexdevtools/apex-parser';

import { DeclarationTypeClass } from '.';

import { TypeRefTypeClass, TypeVisitor, isTypeRefType } from '../typeVisitor';
import {
    VariableDeclaratorsTypeClass,
    VariableVisitor,
    isVariableDeclaratorsType,
} from '../variableVisitor';
import { ErrorTypeClass, CommonTypeClass, isErrorType } from '../commonVisitor';

export class FieldDeclarationTypeClass extends DeclarationTypeClass<VariableDeclaratorsTypeClass> {
    private valueType: TypeRefTypeClass | null = null;

    private constructor(
        value: VariableDeclaratorsTypeClass | null,
        valueType: TypeRefTypeClass | null,
        errorClasses: Record<string, ErrorTypeClass>,
    ) {
        super('fieldDeclaration', value, errorClasses);
        this.valueType = valueType;
    }

    static create(ctx: FieldDeclarationContext): FieldDeclarationTypeClass {
        if (!ctx.typeRef() || !ctx.variableDeclarators()) {
            throw new Error('値が異常です。FieldDeclarationContext: ' + ctx.getText());
        }

        let value: VariableDeclaratorsTypeClass | null = null;
        let valueType: TypeRefTypeClass | null = null;
        const errorClasses: Record<string, ErrorTypeClass> = {};

        const variableTypeClass = new VariableVisitor().visit(ctx.variableDeclarators());
        if (isVariableDeclaratorsType(variableTypeClass)) {
            value = variableTypeClass;
        } else if (isErrorType(variableTypeClass)) {
            errorClasses['value'] = variableTypeClass;
        }

        const typeTypeClass = new VariableVisitor().visit(ctx.variableDeclarators());
        if (isTypeRefType(typeTypeClass)) {
            valueType = typeTypeClass;
        } else if (isErrorType(typeTypeClass)) {
            errorClasses['valueType'] = typeTypeClass;
        }

        return new FieldDeclarationTypeClass(value, valueType, errorClasses);
    }

    getValueType(): TypeRefTypeClass | null {
        return this.valueType;
    }

    isValueTypeNull(): boolean {
        return this.valueType === null;
    }
}

export const isFieldDeclarationType = (
    target: CommonTypeClass,
): target is FieldDeclarationTypeClass => {
    return target instanceof FieldDeclarationTypeClass;
};
