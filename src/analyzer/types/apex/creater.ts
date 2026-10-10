import {
    Creator,
    ArrayCreatorRest,
    ClassCreatorRest,
    MapCreatorRest,
    NoRest,
    SetCreatorRest,
} from './converter';

import { ExpressionType, makeExpressionType } from './expression';
import { TypeType, makeTypeType } from './type';

type ArrayValue = {
    value?: ExpressionType[];
    size?: ExpressionType;
};

type ClassValue = {
    args: ExpressionType[];
};

type MapValue = {
    value: {
        key: ExpressionType;
        value: ExpressionType;
    }[];
};

type SetValue = {
    value?: ExpressionType[];
};

type NoValue = {
    rest?: string;
};

export type CreatorType =
    | ({
          name: string[];
          generic?: TypeType[] | undefined;
      } & (ArrayValue | ClassValue | MapValue | SetValue | NoValue))
    | undefined;

export const makeCreatorType = (creator: Creator): CreatorType => {
    if (creator && creator.value) {
        const value = creator.value;

        if (value) {
            const name: string[] = [];
            const generic: TypeType[] = [];
            value.forEach((item, index) => {
                if (item.left) {
                    name.push(item.left);
                }
                if (item.right && value.length === index + 1) {
                    generic.push(...item.right.map((typeRef) => makeTypeType(typeRef)));
                }
            });

            if (!creator.content) {
                return {
                    name: name,
                    generic: generic.length > 0 ? generic : undefined,
                };
            } else {
                if (creator.type === 'array') {
                    const value = creator.content.value;
                    const size = creator.content.size;

                    const initialValue: any[] = [];
                    if (value) {
                        value.forEach((element) => {
                            initialValue.push(makeExpressionType(element));
                        });
                    }

                    return {
                        name: name,
                        generic: generic.length > 0 ? generic : undefined,
                        value: initialValue.length > 0 ? initialValue : undefined,
                        size: size !== undefined ? makeExpressionType(size) : undefined,
                    };
                }
                if (creator.type === 'class') {
                    const content = creator.content;
                    const args: any[] = [];
                    if (content) {
                        content.forEach((arg) => {
                            args.push(makeExpressionType(arg));
                        });
                    }
                    return {
                        name: name,
                        generic: generic.length > 0 ? generic : undefined,
                        args: args.length > 0 ? args : undefined,
                    };
                }
                if (creator.type === 'map') {
                    const content = creator.content;
                    const initialValue: {
                        key: any;
                        value: any;
                    }[] = [];
                    if (content) {
                        content.forEach((entry) => {
                            const key = entry.left;
                            const value = entry.right;
                            initialValue.push({
                                key: makeExpressionType(key),
                                value: makeExpressionType(value),
                            });
                        });
                    }
                    return {
                        name: name,
                        generic: generic.length > 0 ? generic : undefined,
                        value: initialValue.length > 0 ? initialValue : undefined,
                    };
                }
                if (creator.type === 'set') {
                    const content = creator.content;
                    const initialValue: any[] = [];
                    if (content) {
                        content.forEach((element) => {
                            initialValue.push(makeExpressionType(element));
                        });
                    }
                    return {
                        name: name,
                        generic: generic.length > 0 ? generic : undefined,
                        value: initialValue.length > 0 ? initialValue : undefined,
                    };
                }
                if (creator.type === 'no') {
                    const content = creator.content;
                    return {
                        name: name,
                        generic: generic.length > 0 ? generic : undefined,
                        rest: content ? content : undefined,
                    };
                }
            }
        }
    }
    return undefined;
};
