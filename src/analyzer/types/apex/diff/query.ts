import { SelectField } from '../query/select';

type UpdateFieldDiff = {
    field: string[];
    beforeAlias: string | null;
    afterAlias: string | null;
};

export type FieldDiffSet = {
    added: SelectField['field'];
    updated: UpdateFieldDiff[];
    removed: SelectField['field'];
};

export const makeFieldDiff = (before: SelectField['field'], after: SelectField['field']) => {
    if (!before && !after) {
        return { added: [], updated: [], removed: [] };
    }

    if (!before) {
        return { added: after, updated: [], removed: [] };
    }

    if (!after) {
        return { added: [], updated: [], removed: before };
    }

    const added: SelectField['field'] = [];
    const updated: UpdateFieldDiff[] = [];
    const removed: SelectField['field'] = [];

    const copiedBefore = [...before];
    const copiedAfter = [...after];

    copiedBefore.forEach((select) => {
        const field = select.field;
        const alias = select.alias;

        const sameFieldFieldIndex = copiedAfter.findIndex((s) =>
            s.field.every((f, i) => f === field[i]),
        );

        if (sameFieldFieldIndex === -1) {
            removed.push(select);
        } else if (copiedAfter.at(sameFieldFieldIndex)!.alias !== alias) {
            updated.push({
                field: field,
                beforeAlias: alias || null,
                afterAlias: copiedAfter.at(sameFieldFieldIndex)!.alias || null,
            });
        } else {
            copiedAfter.splice(sameFieldFieldIndex, 1);
        }
    });

    if (copiedAfter.length > 0) {
        added.push(...copiedAfter);
    }

    return { added, updated, removed };
};
