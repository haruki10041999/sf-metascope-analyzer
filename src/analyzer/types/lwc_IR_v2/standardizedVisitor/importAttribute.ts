import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isImportAttribute, type ImportAttribute } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
    getSourceSpan,
} from '../commonVisitor';
import { identifierTypePair, type IdentifierTypeClass } from '../commons/identifier';
import { stringLiteralTypePair, StringLiteralTypeClass } from '../commons/stringLiteral';

const importAttributeKeyPairs = lazyPairs(
    () => [identifierTypePair, stringLiteralTypePair] as const,
);

export type ImportAttributeFields = TypeField<'importAttribute'> & {
    key: IdentifierTypeClass | StringLiteralTypeClass;
    value: StringLiteralTypeClass;
};

export class ImportAttributeTypeClass extends LwcCommonTypeClass<
    'importAttribute',
    ImportAttributeFields
> {
    private constructor(value: FieldsOf<ImportAttributeFields>, sourceSpan: SourceSpan) {
        super('importAttribute', value, sourceSpan);
    }

    static create(target: ImportAttribute, originalSource: string): ImportAttributeTypeClass {
        return new ImportAttributeTypeClass(
            {
                key: visitNode(
                    target.key,
                    originalSource,
                    importAttributeKeyPairs(),
                    'ImportAttribute.key',
                ),
                value: StringLiteralTypeClass.create(target.value, originalSource),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getKey(): ImportAttributeFields['key'] {
        return this.getFields().key;
    }

    getValue(): ImportAttributeFields['value'] {
        return this.getFields().value;
    }
}

export const importAttributeTypePair: EvaluatePair<ImportAttribute, ImportAttributeTypeClass> =
    makeEvaluatePair(isImportAttribute, (target, originalSource) =>
        ImportAttributeTypeClass.create(target, originalSource),
    );

export const isImportAttributeType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is ImportAttributeTypeClass => target instanceof ImportAttributeTypeClass;
