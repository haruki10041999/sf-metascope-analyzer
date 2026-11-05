import { isTSImportEqualsDeclaration, type TSImportEqualsDeclaration } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
} from '../commonVisitor';
import {
    tSEntityNameVisitorEvaluatePairs,
    type TSEntityNameTypeClass,
} from '../tsEntityNameVisitor';
import {
    tSExternalModuleReferenceTypePair,
    type TSExternalModuleReferenceTypeClass,
} from '../typeScriptVisitor/tSExternalModuleReference';
import { identifierTypePair, type IdentifierTypeClass } from './identifier';

const tSImportEqualsDeclarationIdPairs = lazyPairs(() => [identifierTypePair] as const);
const tSImportEqualsDeclarationModuleReferencePairs = lazyPairs(
    () => [...tSEntityNameVisitorEvaluatePairs(), tSExternalModuleReferenceTypePair] as const,
);

export type TSImportEqualsDeclarationFields = {
    id: IdentifierTypeClass | LwcErrorTypeClass;
    moduleReference: TSEntityNameTypeClass | TSExternalModuleReferenceTypeClass | LwcErrorTypeClass;
    importKind: NonNullable<TSImportEqualsDeclaration['importKind']> | null;
};

export class TSImportEqualsDeclarationTypeClass extends LwcCommonTypeClass<'tSImportEqualsDeclaration'> {
    private readonly value: TSImportEqualsDeclarationFields;

    private constructor(value: TSImportEqualsDeclarationFields) {
        super('tSImportEqualsDeclaration');
        this.value = value;
    }

    static create(
        target: TSImportEqualsDeclaration,
        originalSource: string,
    ): TSImportEqualsDeclarationTypeClass {
        return new TSImportEqualsDeclarationTypeClass({
            id: visitNode(
                target.id,
                originalSource,
                tSImportEqualsDeclarationIdPairs(),
                'TSImportEqualsDeclaration.id',
            ),
            moduleReference: visitNode(
                target.moduleReference,
                originalSource,
                tSImportEqualsDeclarationModuleReferencePairs(),
                'TSImportEqualsDeclaration.moduleReference',
            ),
            importKind: target.importKind ?? null,
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): TSImportEqualsDeclarationFields {
        return this.value;
    }

    getId(): TSImportEqualsDeclarationFields['id'] {
        return this.value.id;
    }

    getModuleReference(): TSImportEqualsDeclarationFields['moduleReference'] {
        return this.value.moduleReference;
    }

    getImportKind(): TSImportEqualsDeclarationFields['importKind'] {
        return this.value.importKind;
    }
}

export const tSImportEqualsDeclarationTypePair: EvaluatePair<
    TSImportEqualsDeclaration,
    TSImportEqualsDeclarationTypeClass
> = makeEvaluatePair(isTSImportEqualsDeclaration, (target, originalSource) =>
    TSImportEqualsDeclarationTypeClass.create(target, originalSource),
);

export const isTSImportEqualsDeclarationType = (
    target: LwcCommonTypeClass<string>,
): target is TSImportEqualsDeclarationTypeClass =>
    target instanceof TSImportEqualsDeclarationTypeClass;
