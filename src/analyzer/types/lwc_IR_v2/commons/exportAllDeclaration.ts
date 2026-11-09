import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isExportAllDeclaration, type ExportAllDeclaration } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    getSourceSpan,
} from '../commonVisitor';
import { ImportAttributeTypeClass } from '../standardizedVisitor/importAttribute';
import { StringLiteralTypeClass } from './stringLiteral';

export type ExportAllDeclarationFields = TypeField<'exportAllDeclaration'> & {
    source: StringLiteralTypeClass;
    exportKind: NonNullable<ExportAllDeclaration['exportKind']>;
    attributes: ImportAttributeTypeClass[] | null;
};

export class ExportAllDeclarationTypeClass extends LwcCommonTypeClass<
    'exportAllDeclaration',
    ExportAllDeclarationFields
> {
    private constructor(value: FieldsOf<ExportAllDeclarationFields>, sourceSpan: SourceSpan) {
        super('exportAllDeclaration', value, sourceSpan);
    }

    static create(
        target: ExportAllDeclaration,
        originalSource: string,
    ): ExportAllDeclarationTypeClass {
        return new ExportAllDeclarationTypeClass(
            {
                source: StringLiteralTypeClass.create(target.source, originalSource),
                exportKind: target.exportKind ?? 'value',
                attributes:
                    target.attributes == null
                        ? null
                        : target.attributes.map((child) =>
                              ImportAttributeTypeClass.create(child, originalSource),
                          ),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getSource(): ExportAllDeclarationFields['source'] {
        return this.getFields().source;
    }

    getExportKind(): ExportAllDeclarationFields['exportKind'] {
        return this.getFields().exportKind;
    }

    getAttributes(): ExportAllDeclarationFields['attributes'] {
        return this.getFields().attributes;
    }
}

export const exportAllDeclarationTypePair: EvaluatePair<
    ExportAllDeclaration,
    ExportAllDeclarationTypeClass
> = makeEvaluatePair(isExportAllDeclaration, (target, originalSource) =>
    ExportAllDeclarationTypeClass.create(target, originalSource),
);

export const isExportAllDeclarationType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is ExportAllDeclarationTypeClass => target instanceof ExportAllDeclarationTypeClass;
