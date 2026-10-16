import typia from 'typia';

import { isString, isTypeRefClass, MethodDeclarationClass } from '../converter';

import { RewriteQueries, QueryStore, extractQueries } from '../../../parser/Apex/extractor/commons';
import { TypeType, makeTypeType } from '../type';
import { ParameterType, makeParameterType } from './parameter';
import { BlockField, makeBlockField } from '../statement';

export type MethodField = {
    kind: 'method';
    name: string;
    returnType: TypeType | 'void';
    param?: ParameterType[];
    soql?: QueryStore['soql'];
    sosl?: QueryStore['sosl'];
} & ({} | RewriteQueries<BlockField>);

export const isMethodField = typia.createIs<MethodField>();

export const makeMethodField = (
    methodDeclaration: MethodDeclarationClass,
): MethodField | undefined => {
    const name = methodDeclaration.getValue();
    const valueType = methodDeclaration.getValueType();
    const queryStore: QueryStore = { soql: [], sosl: [] };
    const param = makeParameterType(methodDeclaration.getParam());
    const block = extractQueries(makeBlockField(methodDeclaration.getBlock()), queryStore);

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

        if (block) {
            methodField = {
                ...methodField,
                ...block,
            };
        }

        if (queryStore.soql.length > 0) {
            methodField.soql = queryStore.soql;
        }
        if (queryStore.sosl.length > 0) {
            methodField.sosl = queryStore.sosl;
        }
    }

    return methodField;
};

