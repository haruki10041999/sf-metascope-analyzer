import { isMetaProperty, type MetaProperty } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
} from '../commonVisitor';
import { identifierTypePair, type IdentifierTypeClass } from './identifier';

const metaPropertyMetaPairs = lazyPairs(() => [identifierTypePair] as const);
const metaPropertyPropertyPairs = lazyPairs(() => [identifierTypePair] as const);

export type MetaPropertyFields = {
    meta: IdentifierTypeClass | LwcErrorTypeClass;
    property: IdentifierTypeClass | LwcErrorTypeClass;
};

export class MetaPropertyTypeClass extends LwcCommonTypeClass<'metaProperty'> {
    private readonly value: MetaPropertyFields;

    private constructor(value: MetaPropertyFields) {
        super('metaProperty');
        this.value = value;
    }

    static create(target: MetaProperty, originalSource: string): MetaPropertyTypeClass {
        return new MetaPropertyTypeClass({
            meta: visitNode(
                target.meta,
                originalSource,
                metaPropertyMetaPairs(),
                'MetaProperty.meta',
            ),
            property: visitNode(
                target.property,
                originalSource,
                metaPropertyPropertyPairs(),
                'MetaProperty.property',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): MetaPropertyFields {
        return this.value;
    }

    getMeta(): MetaPropertyFields['meta'] {
        return this.value.meta;
    }

    getProperty(): MetaPropertyFields['property'] {
        return this.value.property;
    }
}

export const metaPropertyTypePair: EvaluatePair<MetaProperty, MetaPropertyTypeClass> =
    makeEvaluatePair(isMetaProperty, (target, originalSource) =>
        MetaPropertyTypeClass.create(target, originalSource),
    );

export const isMetaPropertyType = (
    target: LwcCommonTypeClass<string>,
): target is MetaPropertyTypeClass => target instanceof MetaPropertyTypeClass;
