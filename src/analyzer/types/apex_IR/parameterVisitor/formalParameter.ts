import { FormalParameterContext } from '@apexdevtools/apex-parser';

import { ParameterTypeClass } from '../parameterVisitor';

import { NormalIdTypeClass, IdVisitor, isNormalIdType } from '../idVisitor';
import { NormalModifierTypeClass, ModifierVisitor, isNormalModifierType } from '../modifierVisitor';
import { TypeRefTypeClass, TypeVisitor, isTypeRefType } from '../typeVisitor';
import {
    ApexErrorTypeClass,
    ApexCommonTypeClass,
    visitNodeList,
    visitNode,
} from '../commonVisitor';

export class FormalParameterTypeClass extends ParameterTypeClass<
    'formalParameter',
    NormalIdTypeClass
> {
    private valueType: TypeRefTypeClass | ApexErrorTypeClass;
    private modifier: (NormalModifierTypeClass | ApexErrorTypeClass)[] = [];

    private constructor(
        value: NormalIdTypeClass | ApexErrorTypeClass,
        valueType: TypeRefTypeClass | ApexErrorTypeClass,
        modifier: (NormalModifierTypeClass | ApexErrorTypeClass)[],
    ) {
        super('formalParameter', value);
        this.valueType = valueType;
        this.modifier = modifier;
    }

    static create(ctx: FormalParameterContext): FormalParameterTypeClass {
        if (!ctx.id() || !ctx.typeRef()) {
            throw new Error('値が異常です。FormalParameterContext: ' + ctx.getText());
        }

        return new FormalParameterTypeClass(
            visitNode(new IdVisitor(), ctx.id(), isNormalIdType, 'id'),
            visitNode(new TypeVisitor(), ctx.typeRef(), isTypeRefType, 'typeRef'),
            visitNodeList(
                new ModifierVisitor(),
                ctx.modifier_list() || [],
                isNormalModifierType,
                'modifier',
            ),
        );
    }

    getValueType(): TypeRefTypeClass | ApexErrorTypeClass {
        return this.valueType;
    }

    getModifier(): (NormalModifierTypeClass | ApexErrorTypeClass)[] {
        return this.modifier;
    }
}

export const isFormalParameterType = (
    target: ApexCommonTypeClass<string>,
): target is FormalParameterTypeClass => {
    return target instanceof FormalParameterTypeClass;
};
