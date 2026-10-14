import { PropertyDeclarationClass, PropertyBlockClass } from '../converter';

import { TypeType, makeTypeType } from '../type';
import { ModifierType, makeModifierType } from '../modifier';
import { StatementType, makeStatementType } from '../statement';

type PropertyBlockField = {
    type: 'getter' | 'setter';
    block?: StatementType[];
    modifier?: ModifierType;
};

export type PropertyField = {
    kind: 'property';
    variant: string;
    variantType: TypeType;
    block?: PropertyBlockField[];
};

const makePropertyBlockField = (
    propertyBlock: PropertyBlockClass,
): PropertyBlockField | undefined => {
    const type = propertyBlock.getType();
    const block = propertyBlock
        .getValue()
        .map((b) => makeStatementType(b))
        .filter((b) => b !== undefined);
    const modifier = makeModifierType(propertyBlock.getModifier());

    if (type) {
        const propertyBlockField: PropertyBlockField = {
            type: type,
        };

        if (block.length > 0) {
            propertyBlockField.block = block;
        }

        if (modifier) {
            propertyBlockField.modifier = modifier;
        }

        return propertyBlockField;
    }

    return undefined;
};

export const makePropertyField = (
    propertyDeclaration: PropertyDeclarationClass,
): PropertyField | undefined => {
    const variant = propertyDeclaration.getValue();
    const variantType = makeTypeType(propertyDeclaration.getValueType());
    const block = propertyDeclaration
        .getBlock()
        .map((b) => makePropertyBlockField(b))
        .filter((b) => b !== undefined);

    if (variant && variantType) {
        const propertyField: PropertyField = {
            kind: 'property',
            variant: variant,
            variantType: variantType,
        };

        if (block.length > 0) {
            propertyField.block = block;
        }

        return propertyField;
    }

    return undefined;
};
