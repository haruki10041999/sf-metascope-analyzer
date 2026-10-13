import { FromNameClass, isFromNameClass } from '../converter';

export type From =
    | {
          field: string;
          alias?: string;
      }
    | 'unSupported';

export const makeFrom = (fromNames: FromNameClass[]): From => {
    if (fromNames.length !== 1) {
        return 'unSupported';
    }

    const field = fromNames.at(0)!.getValue();
    const alias = fromNames.at(0)!.getAlias();

    if (field.length !== 1) {
        return 'unSupported';
    }

    const from: From = {
        field: field.at(0)!,
    };

    if (alias) {
        from.alias = alias;
    }

    return from;
};
