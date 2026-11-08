import { isImportAttribute, type ImportAttribute } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
} from '../commonVisitor';
import { identifierTypePair, type IdentifierTypeClass } from '../commons/identifier';
import { stringLiteralTypePair, type StringLiteralTypeClass } from '../commons/stringLiteral';

const importAttributeKeyPairs = lazyPairs(
    () => [identifierTypePair, stringLiteralTypePair] as const,
);
const importAttributeValuePairs = lazyPairs(() => [stringLiteralTypePair] as const);

export type ImportAttributeFields = {
    key: IdentifierTypeClass | StringLiteralTypeClass | LwcErrorTypeClass;
    value: StringLiteralTypeClass | LwcErrorTypeClass;
};

export class ImportAttributeTypeClass extends LwcCommonTypeClass<'importAttribute'> {
    private readonly value: ImportAttributeFields;

    private constructor(value: ImportAttributeFields) {
        super('importAttribute');
        this.value = value;
    }

    static create(target: ImportAttribute, originalSource: string): ImportAttributeTypeClass {
        return new ImportAttributeTypeClass({
            key: visitNode(
                target.key,
                originalSource,
                importAttributeKeyPairs(),
                'ImportAttribute.key',
            ),
            value: visitNode(
                target.value,
                originalSource,
                importAttributeValuePairs(),
                'ImportAttribute.value',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): ImportAttributeFields {
        return this.value;
    }

    getKey(): ImportAttributeFields['key'] {
        return this.value.key;
    }

    getValue(): ImportAttributeFields['value'] {
        return this.value.value;
    }
}

export const importAttributeTypePair: EvaluatePair<ImportAttribute, ImportAttributeTypeClass> =
    makeEvaluatePair(isImportAttribute, (target, originalSource) =>
        ImportAttributeTypeClass.create(target, originalSource),
    );

export const isImportAttributeType = (
    target: LwcCommonTypeClass<string>,
): target is ImportAttributeTypeClass => target instanceof ImportAttributeTypeClass;
