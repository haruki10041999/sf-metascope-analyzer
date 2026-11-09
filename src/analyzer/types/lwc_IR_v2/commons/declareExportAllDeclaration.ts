import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isDeclareExportAllDeclaration, type DeclareExportAllDeclaration } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    getSourceSpan,
} from '../commonVisitor';
import { ImportAttributeTypeClass } from '../standardizedVisitor/importAttribute';
import { StringLiteralTypeClass } from './stringLiteral';

export type DeclareExportAllDeclarationFields = TypeField<'declareExportAllDeclaration'> & {
    source: StringLiteralTypeClass;
    exportKind: NonNullable<DeclareExportAllDeclaration['exportKind']>;
    attributes: ImportAttributeTypeClass[] | null;
};

export class DeclareExportAllDeclarationTypeClass extends LwcCommonTypeClass<
    'declareExportAllDeclaration',
    DeclareExportAllDeclarationFields
> {
    private constructor(
        value: FieldsOf<DeclareExportAllDeclarationFields>,
        sourceSpan: SourceSpan,
    ) {
        super('declareExportAllDeclaration', value, sourceSpan);
    }

    static create(
        target: DeclareExportAllDeclaration,
        originalSource: string,
    ): DeclareExportAllDeclarationTypeClass {
        return new DeclareExportAllDeclarationTypeClass(
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

    getSource(): DeclareExportAllDeclarationFields['source'] {
        return this.getFields().source;
    }

    getExportKind(): DeclareExportAllDeclarationFields['exportKind'] {
        return this.getFields().exportKind;
    }

    getAttributes(): DeclareExportAllDeclarationFields['attributes'] {
        return this.getFields().attributes;
    }
}

export const declareExportAllDeclarationTypePair: EvaluatePair<
    DeclareExportAllDeclaration,
    DeclareExportAllDeclarationTypeClass
> = makeEvaluatePair(isDeclareExportAllDeclaration, (target, originalSource) =>
    DeclareExportAllDeclarationTypeClass.create(target, originalSource),
);

export const isDeclareExportAllDeclarationType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is DeclareExportAllDeclarationTypeClass =>
    target instanceof DeclareExportAllDeclarationTypeClass;
