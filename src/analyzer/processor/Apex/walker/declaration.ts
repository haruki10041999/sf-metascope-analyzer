import type {
    ClassDeclarationJson,
    InterfaceDeclarationJson,
    EnumDeclarationJson,
    MethodDeclarationJson,
    PropertyDeclarationJson,
    FieldDeclarationJson,
} from '../../../types';

import type { ApexSourceJson } from '../../../parser';

export type DeclarationName = {
    kind:
        | 'class'
        | 'interface'
        | 'enum'
        | 'method'
        | 'property'
        | 'field'
        | 'interfaceMethod'
        | 'enumConstant';
    path: string[];
    name: string;
};

const _makeDeclarationName = (
    declaration:
        | ClassDeclarationJson
        | InterfaceDeclarationJson
        | EnumDeclarationJson
        | MethodDeclarationJson
        | PropertyDeclarationJson
        | FieldDeclarationJson,
    path: string[],
    declarationNames: DeclarationName[],
): void => {
    if (declaration.kind === 'field') {
        const variants = declaration.variants;

        variants.forEach((variant) => {
            declarationNames.push({
                kind: declaration.kind,
                path,
                name: variant.name,
            });
        });
    } else {
        declarationNames.push({
            kind: declaration.kind,
            path,
            name: declaration.name,
        });
    }

    if (declaration.kind === 'class') {
        declaration.block.forEach((d) => {
            if (d.kind === 'initializer' || d.kind === 'constructor' || d.kind === 'notSet') {
                return;
            }

            const { modifier, ...innerDeclaration } = d;
            _makeDeclarationName(innerDeclaration, [...path, declaration.name], declarationNames);
        });
    }

    if (declaration.kind === 'interface') {
        declaration.block?.forEach((d) => {
            declarationNames.push({
                kind: 'interfaceMethod',
                path: [...path, declaration.name],
                name: d.name,
            });
        });
    }

    if (declaration.kind === 'enum') {
        declaration.members?.forEach((d) => {
            declarationNames.push({
                kind: 'enumConstant',
                path: [...path, declaration.name],
                name: d.name,
            });
        });
    }
};

export const makeDeclarationName = (
    unit: Exclude<ApexSourceJson, { fileType: 'error' }>,
): DeclarationName[] => {
    const fileName = unit.fileName;
    const content = unit.content;
    const declarationNames: DeclarationName[] = [];

    if ('kind' in content) {
        const { modifier, ...declaration } = content;
        _makeDeclarationName(declaration, [fileName], declarationNames);
    } else {
        content.block.forEach((d) => {
            if (
                d.kind === 'class' ||
                d.kind === 'interface' ||
                d.kind === 'enum' ||
                d.kind === 'field' ||
                d.kind === 'method' ||
                d.kind === 'property'
            ) {
                _makeDeclarationName(d, [fileName], declarationNames);
            }
        });
    }

    return declarationNames;
};
