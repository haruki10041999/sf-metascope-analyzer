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
import { ErrorTypeClass, CommonTypeClass, isValidClass, isValidClassList } from '../commonVisitor';
import { InsertStatementTypeClass } from '../statementVisitor';

export class InterfaceMethodDeclarationTypeClass extends DeclarationTypeClass<NormalIdTypeClass> {
    private valueType: TypeRefTypeClass | 'void' | ErrorTypeClass;
    private param: FormalParametersTypeClass | ErrorTypeClass | null = null;
    private modifier: (NormalModifierTypeClass | ErrorTypeClass)[] = [];

    private constructor(
        value: NormalIdTypeClass | ErrorTypeClass,
        valueType: TypeRefTypeClass | 'void' | ErrorTypeClass,
        param: FormalParametersTypeClass | ErrorTypeClass | null,
        modifier: (NormalModifierTypeClass | ErrorTypeClass)[],
    ) {
        super('InterfaceMethodDeclaration', value);
        this.valueType = valueType;
        this.param = param;
        this.modifier = modifier;
    }

    static create(ctx: InterfaceMethodDeclarationContext): InterfaceMethodDeclarationTypeClass {
        if (!ctx.id() || (!ctx.VOID() && !ctx.typeRef())) {
            throw new Error('値が異常です。InterfaceMethodDeclarationContext: ' + ctx.getText());
        }

        return new InterfaceMethodDeclarationTypeClass(
            isValidClass(new IdVisitor().visit(ctx.id()), isNormalIdType, 'id'),
            isValidClass(new TypeVisitor().visit(ctx.typeRef()), isTypeRefType, 'typeRef'),
            ctx.formalParameters()
                ? isValidClass(
                      new ParameterVisitor().visit(ctx.formalParameters()),
                      isFormalParametersType,
                      'formalParameters',
                  )
                : null,
            isValidClassList(
                ctx.modifier_list(),
                (ctx) => new ModifierVisitor().visit(ctx),
                isNormalModifierType,
                'modifier_list',
            ),
        );
    }

    getValueType(): TypeRefTypeClass | 'void' | ErrorTypeClass {
        return this.valueType;
    }

    getParam(): FormalParametersTypeClass | ErrorTypeClass | null {
        return this.param;
    }

    getModifier(): (NormalModifierTypeClass | ErrorTypeClass)[] {
        return this.modifier;
    }
}

export const isInterfaceMethodDeclarationType = (
    target: CommonTypeClass,
): target is InterfaceMethodDeclarationTypeClass => {
    return target instanceof InterfaceMethodDeclarationTypeClass;
};
