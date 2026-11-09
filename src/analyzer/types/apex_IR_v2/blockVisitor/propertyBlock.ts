import { PropertyBlockContext } from '@apexdevtools/apex-parser';

import { GetterTypeClass } from './getter';
import { SetterTypeClass } from './setter';

import { ModifierTypeClass } from '../modifierVisitor';
import {
    ApexCommonTypeClass,
    createNode,
    createNodeList,
    getSourceSpan,
    isSpicifyApexCommonTypeClass,
} from '../commonVisitor';
import { type FieldsOf, TypeField } from '../../commons/ir';
import { SourceSpan } from '../../commons';

export type PropertyBlockType = TypeField<'propertyBlock'> & {
    block: GetterTypeClass | SetterTypeClass;
    modifiers: ModifierTypeClass[];
};

export class PropertyBlockTypeClass extends ApexCommonTypeClass<
    'propertyBlock',
    PropertyBlockType
> {
    private constructor(fields: FieldsOf<PropertyBlockType>, sourceSpan: SourceSpan) {
        super('propertyBlock', fields, sourceSpan);
    }

    static create(ctx: PropertyBlockContext): PropertyBlockTypeClass {
        return new PropertyBlockTypeClass(
            {
                block: ctx.getter()
                    ? createNode(ctx.getter(), (c) => GetterTypeClass.create(c), 'getter')
                    : createNode(ctx.setter(), (c) => SetterTypeClass.create(c), 'setter'),
                modifiers: createNodeList(
                    ctx.modifier_list(),
                    (c) => ModifierTypeClass.create(c),
                    'modifier',
                ),
            },
            getSourceSpan(ctx),
        );
    }

    getBlock(): PropertyBlockType['block'] {
        return this.getFields().block;
    }

    getModifiers(): PropertyBlockType['modifiers'] {
        return this.getFields().modifiers;
    }

    /** getModifiers と同じ (v1 の名前) */
    getModifier(): PropertyBlockType['modifiers'] {
        return this.getModifiers();
    }
}

export const isPropertyBlockType = (
    target: ApexCommonTypeClass<string, TypeField<string>>,
): target is PropertyBlockTypeClass => {
    return isSpicifyApexCommonTypeClass('propertyBlock', target);
};
