import { InterfaceMethodDeclarationContext } from '@apexdevtools/apex-parser';

import { DeclarationTypeClass } from '.';

import { NormalIdTypeClass, IdVisitor, isNormalIdType } from '../idVisitor';
import { NormalModifierTypeClass, ModifierVisitor, isNormalModifierType } from '../modifierVisitor';
import { TypeRefTypeClass, TypeVisitor, isTypeRefType } from '../typeVisitor';
import {
    FormalParametersTypeClass,
    ParameterVisitor,
    isFormalParametersType,
} from '../parameterVisitor';
import { ErrorTypeClass, CommonTypeClass, isErrorType } from '../commonVisitor';
import { InsertStatementTypeClass } from '../statementVisitor';

export class InterfaceMethodDeclarationTypeClass extends DeclarationTypeClass<NormalIdTypeClass> {
    private valueType: TypeRefTypeClass | 'void' | null = null;
    private param: FormalParametersTypeClass | null = null;
    private modifier: NormalModifierTypeClass[] = [];

    private constructor(
        value: NormalIdTypeClass | null,
        valueType: TypeRefTypeClass | 'void' | null,
        param: FormalParametersTypeClass | null,
        modifier: NormalModifierTypeClass[],
        errorClasses: Record<string, ErrorTypeClass>,
    ) {
        super('InterfaceMethodDeclaration', value, errorClasses);
        this.valueType = valueType;
        this.param = param;
        this.modifier = modifier;
    }

    static create(ctx: InterfaceMethodDeclarationContext): InterfaceMethodDeclarationTypeClass {
        if (!ctx.id() || (!ctx.VOID() && !ctx.typeRef())) {
            throw new Error('値が異常です。InterfaceMethodDeclarationContext: ' + ctx.getText());
        }

        let value: NormalIdTypeClass | null = null;
        let valueType: TypeRefTypeClass | 'void' | null = null;
        let param: FormalParametersTypeClass | null = null;
        const modifier: NormalModifierTypeClass[] = [];
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

        if (ctx.formalParameters()) {
            const parameterTypeClass = new ParameterVisitor().visit(ctx.formalParameters());
            if (isFormalParametersType(parameterTypeClass)) {
                param = parameterTypeClass;
            } else if (isErrorType(parameterTypeClass)) {
                errorClasses['param'] = parameterTypeClass;
            }
        }

        if (ctx.modifier_list() && ctx.modifier_list().length > 0) {
            ctx.modifier_list().forEach((modifierCtx, index) => {
                const modifierTypeClass = new ModifierVisitor().visit(modifierCtx);
                if (isNormalModifierType(modifierTypeClass)) {
                    modifier.push(modifierTypeClass);
                } else if (isErrorType(modifierTypeClass)) {
                    errorClasses[`modifier_${index}`] = modifierTypeClass;
                }
            });
        }

        return new InterfaceMethodDeclarationTypeClass(
            value,
            valueType,
            param,
            modifier,
            errorClasses,
        );
    }

    getValueType(): TypeRefTypeClass | 'void' | null {
        return this.valueType;
    }

    isValueTypeNull(): boolean {
        return this.valueType === null;
    }

    getParam(): FormalParametersTypeClass | null {
        return this.param;
    }

    isParamNull(): boolean {
        return this.param === null;
    }

    getModifier(): NormalModifierTypeClass[] {
        return this.modifier;
    }
}

export const isInterfaceMethodDeclarationType = (target:CommonTypeClass):target is InterfaceMethodDeclarationTypeClass => {
    return target is InsertStatementTypeClass
}