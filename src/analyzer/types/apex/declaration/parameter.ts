import { FormalParameterClass } from '../converter';

import { TypeType, makeTypeType } from '../type';
import { ModifierType, makeModifierType } from '../modifier';

export type ParameterType = {
    variant: string;
    variantType: TypeType;
    modifier?: ModifierType;
};

export const makeParameterType = (
    formalParameter: FormalParameterClass[],
): ParameterType[] | undefined => {
    const parameterTypes: ParameterType[] = [];

    formalParameter.forEach((f) => {
        const variant = f.getValue();
        const variantType = makeTypeType(f.getValueType());
        const modifier = makeModifierType(f.getModifier());

        if (variant && variantType) {
            const parameterType: ParameterType = {
                variant: variant,
                variantType: variantType,
            };

            if (modifier) {
                parameterType.modifier = modifier;
            }

            parameterTypes.push(parameterType);
        }
    });

    if (parameterTypes.length > 0) {
        return parameterTypes;
    }

    return undefined;
};
