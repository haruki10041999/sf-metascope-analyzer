import { LocalVariableDeclarationClass } from '../converter';

import { TypeType, makeTypeType } from '../type';
import { ModifierType, makeModifierType } from '../modifier';
import { ExpressionType, makeExpressionType } from '../expression';

export type LocalVariableField = {
    kind: 'localVariable';
    variant: { variant: string; initValue?: ExpressionType }[];
    variantType: TypeType;
    modifier?: ModifierType;
};

export const makeLocalVariableField = (
    localVariableStatement: LocalVariableDeclarationClass,
): LocalVariableField | undefined => {
    const variantType = makeTypeType(localVariableStatement.getValueType());
    const modifier = makeModifierType(localVariableStatement.getModifier());

    if (variantType) {
        const variants: { variant: string; initValue?: ExpressionType }[] = [];

        localVariableStatement.getValue().forEach((l) => {
            const value = l.getValue();
            const initValue = makeExpressionType(l.getContent());

            if (value) {
                const variant: { variant: string; initValue?: ExpressionType } = {
                    variant: value,
                };

                if (initValue) {
                    variant.initValue = initValue;
                }

                variants.push(variant);
            }
        });

        const localVariableField: LocalVariableField = {
            kind: 'localVariable',
            variant: variants,
            variantType: variantType,
        };

        if (modifier) {
            localVariableField.modifier = modifier;
        }

        return localVariableField;
    }

    return undefined;
};
