import {
    ModifiersJson,
    ModifierJson,
    AnnotationJson,
    ErrorJson,
    ConvertKeys,
} from '../../../types';

type Modifier = {
    modifierType: string;
} & (ModifierJson | AnnotationJson | ErrorJson);

export type ModifierDiff = {
    kind: 'modifier';
    common: {
        sourceKeys: { before: ConvertKeys; after: ConvertKeys };
        value: Omit<Modifier, 'sourceKeys'>;
    }[];
    before: Modifier[];
    after: Modifier[];
};

export const makeTypedModifierJsons = (target: ModifiersJson): Modifier[] => {
    const modifiers: ({ modifierType: string } & (ModifierJson | AnnotationJson | ErrorJson))[] =
        [];

    Object.entries(target).forEach(([key, value]) => {
        value.forEach((v) => {
            modifiers.push({
                modifierType: key,
                ...v,
            });
        });
    });

    return modifiers;
};

export const makeModifierDiff = (before: ModifiersJson, after: ModifiersJson): ModifierDiff => {
    const common: ModifierDiff['common'] = [];
    const _before: Modifier[] = [];
    const _after = makeTypedModifierJsons(after);

    makeTypedModifierJsons(before).forEach((b) => {
        const index = _after.findIndex((a) => a.sourceKeys.objectKey === b.sourceKeys.objectKey);

        if (index !== -1) {
            const { sourceKeys: beforeSorceKeys, ...rest } = b;
            const { sourceKeys: afterSourceKeys, ..._rest } = _after[index]!;

            common.push({
                sourceKeys: { before: beforeSorceKeys, after: afterSourceKeys },
                value: rest,
            });
            _after.splice(index, 1);
        } else {
            _before.push(b);
        }
    });

    return {
        kind: 'modifier',
        common,
        before: _before,
        after: _after,
    };
};
