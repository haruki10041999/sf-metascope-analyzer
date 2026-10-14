import {
    InterfaceDeclarationClass,
    InterfaceMethodDeclarationClass,
    isString,
    isTypeRefClass,
} from '../converter';

import { ModifierType, makeModifierType } from '../modifier';
import { TypeType, makeTypeType } from '../type';
import { ParameterType, makeParameterType } from './parameter';

type InterfaceMethodField = {
    name: string;
    returnType: TypeType | 'void';
    param?: ParameterType[];
    modifier?: ModifierType;
};

export type InterfaceField = {
    kind: 'interface';
    name: string;
    block: InterfaceMethodField[];
    extend?: TypeType[];
};

const makeInterfaceMethodField = (
    interfaceMethodDeclaration: InterfaceMethodDeclarationClass[],
): InterfaceMethodField[] | undefined => {
    const interfaceMethodFields: InterfaceMethodField[] = [];

    interfaceMethodDeclaration.forEach((i) => {
        const name = i.getValue();
        const valueType = i.getValueType();
        const param = makeParameterType(i.getParam());
        const modifier = makeModifierType(i.getModifier());

        let interfaceMethodField: InterfaceMethodField | undefined = undefined;
        if (name && valueType) {
            if (isString(valueType)) {
                interfaceMethodField = {
                    name: name,
                    returnType: 'void',
                };
            }

            if (isTypeRefClass(valueType)) {
                const returnType = makeTypeType(valueType);
                if (returnType) {
                    interfaceMethodField = {
                        name: name,
                        returnType: returnType,
                    };
                }
            }
        }

        if (interfaceMethodField) {
            if (param) {
                interfaceMethodField.param = param;
            }

            if (modifier) {
                interfaceMethodField.modifier = modifier;
            }

            interfaceMethodFields.push(interfaceMethodField);
        }
    });

    if (interfaceMethodFields.length > 0) {
        return interfaceMethodFields;
    }

    return undefined;
};

export const makeInterfaceField = (
    interfaceDeclaration: InterfaceDeclarationClass,
): InterfaceField | undefined => {
    const name = interfaceDeclaration.getValue();
    const body = makeInterfaceMethodField(interfaceDeclaration.getBody());
    const extend = interfaceDeclaration
        .getExtend()
        .map((e) => makeTypeType(e))
        .filter((e) => e !== undefined);

    if (name && body) {
        const interfaceField: InterfaceField = {
            kind: 'interface',
            name: name,
            block: body,
        };

        if (extend.length > 0) {
            interfaceField.extend = extend;
        }

        return interfaceField;
    }

    return undefined;
};
