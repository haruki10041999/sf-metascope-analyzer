import { isString, isTypeRefClass, MethodDeclarationClass } from '../converter';

import { TypeType, makeTypeType } from '../type';
import { ParameterType, makeParameterType } from './parameter';
import { StatementType, makeStatementType } from '../statement';

export type MethodField = {
    kind: 'method';
    name: string;
    returnType: TypeType | 'void';
    param?: ParameterType[];
    block?: StatementType[];
};

export const makeMethodField = (
    methodDeclaration: MethodDeclarationClass,
): MethodField | undefined => {
    const name = methodDeclaration.getValue();
    const valueType = methodDeclaration.getValueType();
    const param = makeParameterType(methodDeclaration.getParam());
    const block = methodDeclaration
        .getBlock()
        .map((b) => makeStatementType(b))
        .filter((b) => b !== undefined);

    let methodField: MethodField | undefined = undefined;
    if (name && valueType) {
        if (isString(valueType)) {
            methodField = {
                kind: 'method',
                name: name,
                returnType: 'void',
            };
        }

        if (isTypeRefClass(valueType)) {
            const returnType = makeTypeType(valueType);
            if (returnType) {
                methodField = {
                    kind: 'method',
                    name: name,
                    returnType: returnType,
                };
            }
        }
    }

    if (methodField) {
        if (param) {
            methodField.param = param;
        }

        if (block.length > 0) {
            methodField.block = block;
        }

        return methodField;
    }

    return undefined;
};
