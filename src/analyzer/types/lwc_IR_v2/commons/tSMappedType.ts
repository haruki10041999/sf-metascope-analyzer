import { isTSMappedType, type TSMappedType } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
    visitOptionalNode,
} from '../commonVisitor';
import { tSTypeVisitorEvaluatePairs, type TSTypeTypeClass } from '../tsTypeVisitor';
import { identifierTypePair, type IdentifierTypeClass } from './identifier';

const tSMappedTypeKeyPairs = lazyPairs(() => [identifierTypePair] as const);

export type TSMappedTypeFields = {
    key: IdentifierTypeClass | LwcErrorTypeClass;
    constraint: TSTypeTypeClass | LwcErrorTypeClass;
    readonly: NonNullable<TSMappedType['readonly']> | null;
    optional: NonNullable<TSMappedType['optional']> | null;
    typeAnnotation: TSTypeTypeClass | LwcErrorTypeClass | null;
    nameType: TSTypeTypeClass | LwcErrorTypeClass | null;
};

export class TSMappedTypeTypeClass extends LwcCommonTypeClass<'tSMappedType'> {
    private readonly value: TSMappedTypeFields;

    private constructor(value: TSMappedTypeFields) {
        super('tSMappedType');
        this.value = value;
    }

    static create(target: TSMappedType, originalSource: string): TSMappedTypeTypeClass {
        return new TSMappedTypeTypeClass({
            key: visitNode(target.key, originalSource, tSMappedTypeKeyPairs(), 'TSMappedType.key'),
            constraint: visitNode(
                target.constraint,
                originalSource,
                tSTypeVisitorEvaluatePairs(),
                'TSTypeVisitor',
            ),
            readonly: target.readonly ?? null,
            optional: target.optional ?? null,
            typeAnnotation: visitOptionalNode(
                target.typeAnnotation,
                originalSource,
                tSTypeVisitorEvaluatePairs(),
                'TSTypeVisitor',
            ),
            nameType: visitOptionalNode(
                target.nameType,
                originalSource,
                tSTypeVisitorEvaluatePairs(),
                'TSTypeVisitor',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): TSMappedTypeFields {
        return this.value;
    }

    getKey(): TSMappedTypeFields['key'] {
        return this.value.key;
    }

    getConstraint(): TSMappedTypeFields['constraint'] {
        return this.value.constraint;
    }

    getReadonly(): TSMappedTypeFields['readonly'] {
        return this.value.readonly;
    }

    getOptional(): TSMappedTypeFields['optional'] {
        return this.value.optional;
    }

    getTypeAnnotation(): TSMappedTypeFields['typeAnnotation'] {
        return this.value.typeAnnotation;
    }

    getNameType(): TSMappedTypeFields['nameType'] {
        return this.value.nameType;
    }
}

export const tSMappedTypeTypePair: EvaluatePair<TSMappedType, TSMappedTypeTypeClass> =
    makeEvaluatePair(isTSMappedType, (target, originalSource) =>
        TSMappedTypeTypeClass.create(target, originalSource),
    );

export const isTSMappedTypeType = (
    target: LwcCommonTypeClass<string>,
): target is TSMappedTypeTypeClass => target instanceof TSMappedTypeTypeClass;
