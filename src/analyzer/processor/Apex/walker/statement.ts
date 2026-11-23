import {
    StatementJson,
    LocalVariableDeclarationJson,
    BaseExpressionJson,
    TypeJson,
} from '../../../types';

import type { ApexSourceJson } from '../../../parser';

export type VariableName = {
    kind:'property' | 'field' | 'localVariable'
    path: { path: string[]; index: number };
    name: string;
    variableType: TypeJson;
    value: BaseExpressionJson | null;
};

export const _make = ()

export const findLocalVariableNameOf = (
    path: string[],
    statementBlock: StatementJson[],
): VariableJson[] => {
    const variables: VariableJson[] = [];

    statementBlock.forEach((statement, index) => {
        if (statement.kind === 'localVariable') {
            const type: TypeJson = statement.variantType;

            statement.variants.forEach((variant) => {
                variables.push({
                    path: { path: path, index: index },
                    name: variant.name,
                    variableType: type,
                    value: variant.init ? variant.init : null,
                });
            });
        }
    });

    return variables;
};
