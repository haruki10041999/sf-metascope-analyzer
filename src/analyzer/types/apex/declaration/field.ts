import { FieldDeclarationClass, VariableDeclaratorClass } from '../converter';

import { ExpressionType, makeExpressionType } from '../expression';
import { TypeType, makeTypeType } from '../type';

type VariantField = {
    variant: string;
    initValue?: ExpressionType;
};

export type FieldField = {
    kind: 'field';
    variant: VariantField[];
    variantType: TypeType;
};

export const makeFieldField = (fieldDeclaration: FieldDeclarationClass): FieldField | undefined => {
    const value = fieldDeclaration.getValue();
    const variantType = makeTypeType(fieldDeclaration.getValueType());

    if (value.length > 0 && variantType) {
        const variants: VariantField[] = [];

        value.forEach((v) => {
            const variant = v.getValue();
            const initValue = makeExpressionType(v.getContent());

            if (variant) {
                const variantField: VariantField = {
                    variant: variant,
                };

                if (initValue) {
                    variantField.initValue = initValue;
                }

                variants.push(variantField);
            }
        });

        return {
            kind: 'field',
            variant: variants,
            variantType: variantType,
        };
    }

    return undefined;
};
