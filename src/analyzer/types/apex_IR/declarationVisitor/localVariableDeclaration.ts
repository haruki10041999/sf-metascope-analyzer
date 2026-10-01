import { LocalVariableDeclarationContext } from '@apexdevtools/apex-parser';

import { DeclarationTypeClass } from '.';

import { NormalModifierTypeClass, ModifierVisitor, isNormalModifierType } from '../modifierVisitor';
import {
    VariableDeclaratorsTypeClass,
    VariableVisitor,
    isVariableDeclaratorsType,
} from '../variableVisitor';
import { TypeRefTypeClass, TypeVisitor, isTypeRefType } from '../typeVisitor';
import { ErrorTypeClass, CommonTypeClass, isErrorType } from '../commonVisitor';

export class LocalVariableDeclarationTypeClass extends DeclarationTypeClass<VariableDeclaratorsTypeClass> {
    private valueType: TypeRefTypeClass | null = null;
    private modifier: NormalModifierTypeClass[] = [];

    private constructor(
        value: VariableDeclaratorsTypeClass | null,
        valueType: TypeRefTypeClass | null,
        modifier: NormalModifierTypeClass[],
        errorClasses: Record<string, ErrorTypeClass>,
    ) {
        super('localVariableDeclaration', value, errorClasses);
        this.valueType = valueType;
        this.modifier = modifier;
    }

    getValueType(): TypeRefTypeClass | null {
        return (this, this.valueType);
    }
}

export type LocalVariableDeclarationType = {
    type: 'localVariableDeclaration';
    declaration: {
        type: TypeType;
        name: VariableType;
        modifier?: ModifierType[];
    };
};

export const makeLocalVariableDeclarationType = (
    ctx: LocalVariableDeclarationContext,
): LocalVariableDeclarationType => {
    if (!ctx.typeRef() || !ctx.variableDeclarators()) {
        throw new Error('値が異常です。LocalVariableDeclarationContext: ' + ctx.getText());
    }

    const variantType = new TypeVisitor().visit(ctx.typeRef());
    const variants = new VariableVisitor().visit(ctx.variableDeclarators());

    const localVariableDeclarationType: LocalVariableDeclarationType = {
        type: 'localVariableDeclaration',
        declaration: {
            type: variantType,
            name: variants,
        },
    };

    if (ctx.modifier_list() && ctx.modifier_list().length > 0) {
        localVariableDeclarationType.declaration.modifier = ctx
            .modifier_list()
            .map((modifierCtx) => {
                const modifier = new ModifierVisitor().visit(modifierCtx);
                return modifier;
            });
    }

    return localVariableDeclarationType;
};
