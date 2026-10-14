import { ConstructorDeclarationClass } from '../converter';

import { ParameterType, makeParameterType } from './parameter';
import { StatementType, makeStatementType } from '../statement';

export type ConstructorField = {
    kind: 'constructor';
    name: string[];
    param?: ParameterType[];
    block: StatementType[];
};

export const makeConstructorField = (
    constructorDeclaration: ConstructorDeclarationClass,
): ConstructorField | undefined => {
    const name = constructorDeclaration.getValue();
    const param = makeParameterType(constructorDeclaration.getParam());
    const block = constructorDeclaration
        .getBlock()
        .map((b) => makeStatementType(b))
        .filter((b) => b !== undefined);

    if (name && block) {
        const constructorField: ConstructorField = {
            kind: 'constructor',
            name: name,
            block: block,
        };

        if (param) {
            constructorField.param = param;
        }

        return constructorField;
    }

    return undefined;
};
