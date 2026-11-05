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
import {
    ApexErrorTypeClass,
    ApexCommonTypeClass,
    visitNodeList,
    visitNode,
    visitOptionalNode,
} from '../commonVisitor';

export class InterfaceMethodDeclarationTypeClass extends DeclarationTypeClass<
    'interfaceMethodDeclaration',
    NormalIdTypeClass
> {
    private valueType: TypeRefTypeClass | 'void' | ApexErrorTypeClass;
    private param: FormalParametersTypeClass | ApexErrorTypeClass | null = null;
    private modifier: (NormalModifierTypeClass | ApexErrorTypeClass)[] = [];

    private constructor(
        value: NormalIdTypeClass | ApexErrorTypeClass,
        valueType: TypeRefTypeClass | 'void' | ApexErrorTypeClass,
        param: FormalParametersTypeClass | ApexErrorTypeClass | null,
        modifier: (NormalModifierTypeClass | ApexErrorTypeClass)[],
    ) {
        super('interfaceMethodDeclaration', value);
        this.valueType = valueType;
        this.param = param;
        this.modifier = modifier;
    }

    static create(ctx: InterfaceMethodDeclarationContext): InterfaceMethodDeclarationTypeClass {
        if (!ctx.id() || (!ctx.VOID() && !ctx.typeRef())) {
            throw new Error('値が異常です。InterfaceMethodDeclarationContext: ' + ctx.getText());
        }

        return new InterfaceMethodDeclarationTypeClass(
            visitNode(new IdVisitor(), ctx.id(), isNormalIdType, 'id'),
            ctx.VOID()
                ? 'void'
                : visitNode(new TypeVisitor(), ctx.typeRef(), isTypeRefType, 'typeRef'),
            visitOptionalNode(
                new ParameterVisitor(),
                ctx.formalParameters(),
                isFormalParametersType,
                'formalParameters',
            ),
            visitNodeList(
                new ModifierVisitor(),
                ctx.modifier_list(),
                isNormalModifierType,
                'modifier_list',
            ),
        );
    }

    getValueType(): TypeRefTypeClass | 'void' | ApexErrorTypeClass {
        return this.valueType;
    }

    getParam(): FormalParametersTypeClass | ApexErrorTypeClass | null {
        return this.param;
    }

    getModifier(): (NormalModifierTypeClass | ApexErrorTypeClass)[] {
        return this.modifier;
    }
}

export const isInterfaceMethodDeclarationType = (
    target: ApexCommonTypeClass<string>,
): target is InterfaceMethodDeclarationTypeClass => {
    return target instanceof InterfaceMethodDeclarationTypeClass;
};
