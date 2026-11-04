import { isTSImportEqualsDeclaration, type TSImportEqualsDeclaration } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class TSImportEqualsDeclarationTypeClass extends LwcCommonTypeClass<'tSImportEqualsDeclaration'> {
    private constructor(originalSource: string) {
        super('tSImportEqualsDeclaration', originalSource);
    }

    static create(
        target: TSImportEqualsDeclaration,
        originalSource: string,
    ): TSImportEqualsDeclarationTypeClass {
        throw new Error(
            'TSImportEqualsDeclarationTypeClass.create is not implemented: ' + target.type,
        );
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
