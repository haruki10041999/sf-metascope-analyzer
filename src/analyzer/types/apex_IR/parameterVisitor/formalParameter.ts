import { FormalParameterContext } from '@apexdevtools/apex-parser';

import { ParameterTypeClass } from '../parameterVisitor';

import { NormalIdTypeClass, IdVisitor, isNormalIdType } from '../idVisitor';
import { NormalModifierTypeClass, ModifierVisitor, isNormalModifierType } from '../modifierVisitor';
import { TypeRefTypeClass, TypeVisitor, isTypeRefType } from '../typeVisitor';
import { ErrorTypeClass, CommonTypeClass, isValidClass, isValidClassList } from '../commonVisitor';

export class FormalParameterTypeClass extends ParameterTypeClass<NormalIdTypeClass> {
    private valueType: TypeRefTypeClass | ErrorTypeClass;
    private modifier: (NormalModifierTypeClass | ErrorTypeClass)[] = [];

    private constructor(
        value: NormalIdTypeClass | ErrorTypeClass,
        valueType: TypeRefTypeClass | ErrorTypeClass,
        modifier: (NormalModifierTypeClass | ErrorTypeClass)[],
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
            isValidClass(new IdVisitor().visit(ctx.id()), isNormalIdType, 'id'),
            isValidClass(new TypeVisitor().visit(ctx.typeRef()), isTypeRefType, 'typeRef'),
            isValidClassList(
                ctx.modifier_list() || [],
                (ctx) => new ModifierVisitor().visit(ctx),
                isNormalModifierType,
                'modifier',
            ),
        );
    }

    getValueType(): TypeRefTypeClass | ErrorTypeClass {
        return this.valueType;
    }

    getModifier(): (NormalModifierTypeClass | ErrorTypeClass)[] {
        return this.modifier;
    }
}

export const isFormalParameterType = (
    target: CommonTypeClass,
): target is FormalParameterTypeClass => {
    return target instanceof FormalParameterTypeClass;
};
