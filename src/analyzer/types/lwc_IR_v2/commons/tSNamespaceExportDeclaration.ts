import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isTSNamespaceExportDeclaration, type TSNamespaceExportDeclaration } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    getSourceSpan,
} from '../commonVisitor';
import { IdentifierTypeClass } from './identifier';

export type TSNamespaceExportDeclarationFields = TypeField<'tSNamespaceExportDeclaration'> & {
    id: IdentifierTypeClass;
};

export class TSNamespaceExportDeclarationTypeClass extends LwcCommonTypeClass<
    'tSNamespaceExportDeclaration',
    TSNamespaceExportDeclarationFields
> {
    private constructor(
        value: FieldsOf<TSNamespaceExportDeclarationFields>,
        sourceSpan: SourceSpan,
    ) {
        super('tSNamespaceExportDeclaration', value, sourceSpan);
    }

    static create(
        target: TSNamespaceExportDeclaration,
        originalSource: string,
    ): TSNamespaceExportDeclarationTypeClass {
        return new TSNamespaceExportDeclarationTypeClass(
            {
                id: IdentifierTypeClass.create(target.id, originalSource),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getId(): TSNamespaceExportDeclarationFields['id'] {
        return this.getFields().id;
    }
}

export const tSNamespaceExportDeclarationTypePair: EvaluatePair<
    TSNamespaceExportDeclaration,
    TSNamespaceExportDeclarationTypeClass
> = makeEvaluatePair(isTSNamespaceExportDeclaration, (target, originalSource) =>
    TSNamespaceExportDeclarationTypeClass.create(target, originalSource),
);

export const isTSNamespaceExportDeclarationType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is TSNamespaceExportDeclarationTypeClass =>
    target instanceof TSNamespaceExportDeclarationTypeClass;
