import typia from 'typia';

import { TypeDeclarationClass } from '../converter';

import { TypeDeclarationType, makeTypeDeclarationType } from '../declaration';

export type CompilationUnitType = {
    fileType: 'cls';
} & TypeDeclarationType;

export const isCompilationUnitType = typia.createIs<CompilationUnitType>();

export const makeCompilationUnitType = (
    typeDeclaration: TypeDeclarationClass,
): CompilationUnitType | undefined => {
    const typeDeclarationType = makeTypeDeclarationType(typeDeclaration);
    if (typeDeclarationType) {
        return {
            fileType: 'cls',
            ...typeDeclarationType,
        };
    }

    return undefined;
};

