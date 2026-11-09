import { FormalParameterContext } from '@apexdevtools/apex-parser';

import { IdTypeClass } from '../idVisitor';
import { ModifierTypeClass } from '../modifierVisitor';
import { TypeRefTypeClass } from '../typeVisitor';
import {
    ApexCommonTypeClass,
    createNode,
    createNodeList,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type FormalParameterType = TypeField<'formalParameter'> & {
    modifiers: ModifierTypeClass[];
    valueType: TypeRefTypeClass;
    name: IdTypeClass;
};

export class FormalParameterTypeClass extends ApexCommonTypeClass<
    'formalParameter',
    FormalParameterType
> {
    private constructor(fields: FieldsOf<FormalParameterType>, sourceSpan: SourceSpan) {
        super('formalParameter', fields, sourceSpan);
    }

    static create(ctx: FormalParameterContext): FormalParameterTypeClass {
        return new FormalParameterTypeClass(
            {
                modifiers: createNodeList(
                    ctx.modifier_list(),
                    (c) => ModifierTypeClass.create(c),
                    'modifier',
                ),
                valueType: createNode(ctx.typeRef(), (c) => TypeRefTypeClass.create(c), 'typeRef'),
                name: createNode(ctx.id(), (c) => IdTypeClass.create(c), 'id'),
            },
            getSourceSpan(ctx),
        );
    }

    getModifiers(): FormalParameterType['modifiers'] {
        return this.getFields().modifiers;
    }

    getValueType(): FormalParameterType['valueType'] {
        return this.getFields().valueType;
    }

    getName(): FormalParameterType['name'] {
        return this.getFields().name;
    }
}

export const isFormalParameterType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is FormalParameterTypeClass => {
    return isSpicifyApexCommonTypeClass('formalParameter', target);
};
