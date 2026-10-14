import { EnumDeclarationClass } from '../converter';

export type EnumField = {
    kind: 'enum';
    name: string;
    constant?: string[];
};

export const makeEnumField = (enumDeclaration: EnumDeclarationClass): EnumField | undefined => {
    const value = enumDeclaration.getValue();
    const constant = enumDeclaration.getConstant();

    if (value) {
        const enumField: EnumField = {
            kind: 'enum',
            name: value,
        };

        if (constant) {
            enumField.constant = constant;
        }

        return enumField;
    }

    return undefined;
};
