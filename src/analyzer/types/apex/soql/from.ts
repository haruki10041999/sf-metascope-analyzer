import { FromNameClass, isFromNameClass } from '../converter';

export type From = {
    field: string;
    alias?: string;
};

export const makeFrom = (fromNames: FromNameClass[]): From | undefined => {
    if (fromNames.length !== 1) {
        return undefined;
    }

    const field = fromNames.at(0)!.getValue();
    const alias = fromNames.at(0)!.getAlias();

    if (field.length !== 1) {
        return undefined;
    }

    const from: From = {
        field: field.at(0)!,
    };

    if (alias) {
        from.alias = alias;
    }

    return from;
};
