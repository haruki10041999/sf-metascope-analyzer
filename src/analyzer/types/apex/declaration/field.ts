import typia from 'typia';

import { FieldDeclarationClass, VariableDeclaratorClass } from '../converter';

import { RewriteQueries, QueryStore, extractQueries } from '../../../parser/Apex/extractor/commons';
import { ExpressionType, makeExpressionType } from '../expression';
import { TypeType, makeTypeType } from '../type';

type VariantField = {
    variant: string;
    initValue?: ExpressionType;
};

export type FieldField = {
    kind: 'field';
    variant: RewriteQueries<VariantField>[];
    variantType: TypeType;
    soql?: QueryStore['soql'];
    sosl?: QueryStore['sosl'];
};

export const isFieldField = typia.createIs<FieldField>();

export const makeFieldField = (fieldDeclaration: FieldDeclarationClass): FieldField | undefined => {
    const value = fieldDeclaration.getValue();
    const variantType = makeTypeType(fieldDeclaration.getValueType());
    const queryStore: QueryStore = { soql: [], sosl: [] };

    if (value.length > 0 && variantType) {
        const variants: RewriteQueries<VariantField>[] = [];

        value.forEach((v) => {
            const variant = v.getValue();
            const initValue = extractQueries(makeExpressionType(v.getContent()), queryStore);

            if (variant) {
                const variantField: RewriteQueries<VariantField> = {
                    variant: variant,
                };

                if (initValue) {
                    variantField.initValue = initValue;
                }

                variants.push(variantField);
            }
        });

        const fieldField: FieldField = {
            kind: 'field',
            variant: variants,
            variantType: variantType,
        };

        if (queryStore.soql.length > 0) {
            fieldField.soql = queryStore.soql;
        }
        if (queryStore.sosl.length > 0) {
            fieldField.sosl = queryStore.sosl;
        }

        return fieldField;
    }

    return undefined;
};

