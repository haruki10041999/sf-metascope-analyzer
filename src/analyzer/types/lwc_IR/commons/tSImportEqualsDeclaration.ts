import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isTSImportEqualsDeclaration, type TSImportEqualsDeclaration } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
    getSourceSpan,
} from '../commonVisitor';
import {
    tSEntityNameVisitorEvaluatePairs,
    type TSEntityNameTypeClass,
} from '../tsEntityNameVisitor';
import {
    tSExternalModuleReferenceTypePair,
    type TSExternalModuleReferenceTypeClass,
} from '../typeScriptVisitor/tSExternalModuleReference';
import { IdentifierTypeClass } from './identifier';

const tSImportEqualsDeclarationModuleReferencePairs = lazyPairs(
    () => [...tSEntityNameVisitorEvaluatePairs(), tSExternalModuleReferenceTypePair] as const,
);

export type TSImportEqualsDeclarationFields = TypeField<'tSImportEqualsDeclaration'> & {
    id: IdentifierTypeClass;
    moduleReference: TSEntityNameTypeClass | TSExternalModuleReferenceTypeClass;
    importKind: NonNullable<TSImportEqualsDeclaration['importKind']>;
};

export class TSImportEqualsDeclarationTypeClass extends LwcCommonTypeClass<
    'tSImportEqualsDeclaration',
    TSImportEqualsDeclarationFields
> {
    private constructor(value: FieldsOf<TSImportEqualsDeclarationFields>, sourceSpan: SourceSpan) {
        super('tSImportEqualsDeclaration', value, sourceSpan);
    }

    static create(
        target: TSImportEqualsDeclaration,
        originalSource: string,
    ): TSImportEqualsDeclarationTypeClass {
        return new TSImportEqualsDeclarationTypeClass(
            {
                id: IdentifierTypeClass.create(target.id, originalSource),
                moduleReference: visitNode(
                    target.moduleReference,
                    originalSource,
                    tSImportEqualsDeclarationModuleReferencePairs(),
                    'TSImportEqualsDeclaration.moduleReference',
                ),
                importKind: target.importKind ?? 'value',
            },
            getSourceSpan(target, originalSource),
        );
    }

    getId(): TSImportEqualsDeclarationFields['id'] {
        return this.getFields().id;
    }

    getModuleReference(): TSImportEqualsDeclarationFields['moduleReference'] {
        return this.getFields().moduleReference;
    }

    getImportKind(): TSImportEqualsDeclarationFields['importKind'] {
        return this.getFields().importKind;
    }
}

export const tSImportEqualsDeclarationTypePair: EvaluatePair<
    TSImportEqualsDeclaration,
    TSImportEqualsDeclarationTypeClass
> = makeEvaluatePair(isTSImportEqualsDeclaration, (target, originalSource) =>
    TSImportEqualsDeclarationTypeClass.create(target, originalSource),
);

export const isTSImportEqualsDeclarationType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is TSImportEqualsDeclarationTypeClass =>
    target instanceof TSImportEqualsDeclarationTypeClass;
