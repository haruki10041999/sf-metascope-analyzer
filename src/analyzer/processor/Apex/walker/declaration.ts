import type {
    ConvertKeys,
    ClassDeclarationJson,
    InterfaceDeclarationJson,
    EnumDeclarationJson,
    MethodDeclarationJson,
    PropertyDeclarationJson,
    FieldDeclarationJson,
    LocalVariableStatementJson,
    InterfaceMethodJson,
    EnumConstantJson,
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
        | 'enumConstant'
        | 'localVariable';
    sourceKeys: ConvertKeys;
    path: string[];
    name: string;
};

const _makeDeclarationNameOf = (
    declaration:
        | ClassDeclarationJson
        | InterfaceDeclarationJson
        | EnumDeclarationJson
        | MethodDeclarationJson
        | PropertyDeclarationJson
        | FieldDeclarationJson
        | InterfaceMethodJson
        | EnumConstantJson
        | LocalVariableStatementJson,
    path: string[],
    declarationNames: DeclarationName[],
): void => {
    if (declaration.kind === 'field' || declaration.kind === 'localVariable') {
        const variants = declaration.variants;

        variants.forEach((variant) => {
            declarationNames.push({
                kind: declaration.kind,
                path,
                sourceKeys: variant.sourceKeys,
                name: variant.name,
            });
        });
    } else {
        declarationNames.push({
            kind: declaration.kind,
            path,
            sourceKeys:
                'base' in declaration.sourceKeys
                    ? declaration.sourceKeys.base
                    : declaration.sourceKeys,
            name: declaration.name,
        });
    }

    if (declaration.kind === 'class') {
        declaration.block.forEach((d) => {
            if (d.kind === 'initializer' || d.kind === 'constructor' || d.kind === 'notSet') {
                return;
            }

            const { modifier, ...innerDeclaration } = d;
            _makeDeclarationNameOf(innerDeclaration, [...path, declaration.name], declarationNames);
        });
    }

    if (declaration.kind === 'interface') {
        declaration.block?.forEach((interfaceMethod) => {
            _makeDeclarationNameOf(interfaceMethod, [...path, declaration.name], declarationNames);
        });
    }

    if (declaration.kind === 'enum') {
        declaration.members?.forEach((enumConstant) => {
            _makeDeclarationNameOf(enumConstant, [...path, declaration.name], declarationNames);
        });
    }

    if (declaration.kind === 'method') {
        declaration.block?.forEach((statement) => {
            if (statement.kind === 'localVariable') {
                _makeDeclarationNameOf(statement, [...path, declaration.name], declarationNames);
            }
        });
    }
};

export const makeDeclarationNameOf = (
    unit: Exclude<ApexSourceJson, { fileType: 'error' }>,
): DeclarationName[] => {
    const fileName = unit.fileName;
    const content = unit.content;
    const declarationNames: DeclarationName[] = [];

    if ('kind' in content) {
        const { modifier, ...declaration } = content;
        _makeDeclarationNameOf(declaration, [fileName], declarationNames);
    } else {
        content.block.forEach((d) => {
            if (
                d.kind === 'class' ||
                d.kind === 'interface' ||
                d.kind === 'enum' ||
                d.kind === 'field' ||
                d.kind === 'method' ||
                d.kind === 'property' ||
                d.kind === 'localVariable'
            ) {
                _makeDeclarationNameOf(d, [fileName], declarationNames);
            }
        });
    }

    return declarationNames;
};
