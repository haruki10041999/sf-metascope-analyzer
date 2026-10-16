import typia from 'typia';

import { ConstructorDeclarationClass } from '../converter';

import { RewriteQueries, QueryStore, extractQueries } from '../../../parser/Apex/extractor/commons';
import { ParameterType, makeParameterType } from './parameter';
import { BlockField, makeBlockField } from '../statement';

export type ConstructorField = {
    kind: 'constructor';
    name: string[];
    param?: ParameterType[];
    soql?: QueryStore['soql'];
    sosl?: QueryStore['sosl'];
} & ({} | RewriteQueries<BlockField>);

export const isConstructorField = typia.createIs<ConstructorField>();

export const makeConstructorField = (
    constructorDeclaration: ConstructorDeclarationClass,
): ConstructorField | undefined => {
    const name = constructorDeclaration.getValue();
    const param = makeParameterType(constructorDeclaration.getParam());
    const queryStore: QueryStore = { soql: [], sosl: [] };
    const block = extractQueries(makeBlockField(constructorDeclaration.getBlock()), queryStore);

    if (name && block) {
        const constructorField: ConstructorField = {
            kind: 'constructor',
            name: name,
            ...block,
        };

        if (param) {
            constructorField.param = param;
        }

        if (queryStore.soql.length > 0) {
            constructorField.soql = queryStore.soql;
        }
        if (queryStore.sosl.length > 0) {
            constructorField.sosl = queryStore.sosl;
        }

        return constructorField;
    }

    return undefined;
};

