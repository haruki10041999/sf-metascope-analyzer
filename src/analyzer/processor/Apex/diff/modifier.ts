import { DiffAttributeArray } from '../commons';

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

type ModifierDiff = {
    common: {
        objectkey: string;
        data: Omit<Modifier, 'sourceKeys'>;
        before: Omit<ConvertKeys, 'objectKey'>;
        after: Omit<ConvertKeys, 'objectKey'>;
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

export const makeModifierDiff = (
    before: ModifiersJson,
    after: ModifiersJson,
): Modifier[] | ModifierDiff => {
    const common: Modifier[] = [];
    const _before: Modifier[] = [];
    const _after = makeTypedModifierJsons(after);

    makeTypedModifierJsons(before).forEach((b) => {
        const index = _after.findIndex((a) => a.sourceKeys.objectKey === b.sourceKeys.objectKey);

        if (index !== -1) {
            const [a] = _after.splice(index, 1);

            common.push(b);
        } else {
            _before.push(b);
        }
    });

    return _before.length === 0 && _after.length === 0
        ? common
        : {
              common,
              before: _before,
              after: _after,
          };
};
