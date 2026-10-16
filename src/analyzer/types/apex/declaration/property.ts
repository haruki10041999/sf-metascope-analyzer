import typia from 'typia';

import { PropertyDeclarationClass, PropertyBlockClass } from '../converter';

import { RewriteQueries, QueryStore, extractQueries } from '../../../parser/Apex/extractor/commons';
import { TypeType, makeTypeType } from '../type';
import { ModifierType, makeModifierType } from '../modifier';
import { BlockField, makeBlockField } from '../statement';

type PropertyBlockField = {
    kind: 'getter' | 'setter';
    modifier?: ModifierType;
} & ({} | RewriteQueries<BlockField>);

export type PropertyField = {
    kind: 'property';
    variant: string;
    variantType: TypeType;
    block?: PropertyBlockField[];
    soql?: QueryStore['soql'];
    sosl?: QueryStore['sosl'];
};

export const isPropertyField = typia.createIs<PropertyField>();

const makePropertyBlockField = (
    propertyBlock: PropertyBlockClass,
    queryStore: QueryStore,
): PropertyBlockField | undefined => {
    const type = propertyBlock.getType();
    const block = extractQueries(makeBlockField(propertyBlock.getValue()), queryStore);
    const modifier = makeModifierType(propertyBlock.getModifier());

    if (type) {
        let propertyBlockField: PropertyBlockField = {
            kind: type,
        };

        if (block) {
            propertyBlockField = {
                ...propertyBlockField,
                ...block,
            };
        }

        if (modifier) {
            propertyBlockField.modifier = modifier;
        }

        return propertyBlockField;
    }

    return undefined;
};

export const makePropertyField = (
    propertyDeclaration: PropertyDeclarationClass,
): PropertyField | undefined => {
    const queryStore: QueryStore = { soql: [], sosl: [] };
    const variant = propertyDeclaration.getValue();
    const variantType = makeTypeType(propertyDeclaration.getValueType());
    const block = propertyDeclaration
        .getBlock()
        .map((b) => makePropertyBlockField(b, queryStore))
        .filter((b) => b !== undefined);

    if (variant && variantType) {
        const propertyField: PropertyField = {
            kind: 'property',
            variant: variant,
            variantType: variantType,
        };

        if (block.length > 0) {
            propertyField.block = block;
        }

        if (queryStore.soql.length > 0) {
            propertyField.soql = queryStore.soql;
        }
        if (queryStore.sosl.length > 0) {
            propertyField.sosl = queryStore.sosl;
        }

        return propertyField;
    }

    return undefined;
};

