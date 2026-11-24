import type { TypeJson } from '../../../types';

// union の各要素ごとに Omit する（通常の Omit は union の共通キーしか残さない）
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

export type ApexTypeName = {
    kind: 'primitive' | 'custom';
    path: (
        | 'list'
        | 'set'
        | 'mapKey'
        | 'mapValue'
        | { type: 'array'; dimension: number }
        | { type: 'customGeneric'; index: number }
        | string[]
    )[];
    name: string;
};

const _makeApexTypeNameOf = (
    type: DistributiveOmit<TypeJson, 'kind' | 'sourceKeys'>,
    path: ApexTypeName['path'],
    apexTypeNames: ApexTypeName[],
): void => {
    if (type.type === 'primitive') {
        apexTypeNames.push({
            kind: type.type,
            path,
            name: type.primitiveType,
        });
    }

    if (type.type === 'custom') {
        apexTypeNames.push({
            kind: type.type,
            path,
            name: type.customType.join('.'),
        });

        type.generic?.forEach((g, index) => {
            _makeApexTypeNameOf(
                g,
                [...path, type.customType, { type: 'customGeneric', index: index + 1 }],
                apexTypeNames,
            );
        });
    }

    if (type.type === 'array' || type.type === 'list' || type.type === 'set') {
        _makeApexTypeNameOf(
            type.elementType,
            [
                ...path,
                type.type === 'array' ? { type: 'array', dimension: type.dimension } : type.type,
            ],
            apexTypeNames,
        );
    }

    if (type.type === 'map') {
        _makeApexTypeNameOf(type.keyType, [...path, 'mapKey'], apexTypeNames);
        _makeApexTypeNameOf(type.valueType, [...path, 'mapValue'], apexTypeNames);
    }
};

export const makeApexTypeNameOf = (type: TypeJson): ApexTypeName[] => {
    const apexTypeNames: ApexTypeName[] = [];
    _makeApexTypeNameOf(type, [], apexTypeNames);
    return apexTypeNames;
};
