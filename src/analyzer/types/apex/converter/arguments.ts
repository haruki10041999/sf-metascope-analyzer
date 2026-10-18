import typia from 'typia';

import {
    ErrorTypeClass,
    ExpressionListTypeClass,
    NormalArgumentsTypeClass,
    TypeArgumentsTypeClass,
    TypeListTypeClass,
    isExpressionListType,
    isTypeListType,
} from '../../apex_IR';

import {
    SourceSpanInfo,
    CommonBaseClass,
    CommonJson,
    assignClassWithNull,
    isTargetTypeClass,
    ErrorInfo,
    isErrorInfo,
    assignClass,
} from './commons';
import { TypeRefClass, TypeRefJson } from './type';
import { ExpressionClass } from './expression';
import {
    ExpressionListClass,
    ExpressionListJson,
    isExpressionListClass,
    TypeListClass,
    typeListConvert,
    TypeListJson,
} from './list';

export type ArgumentsJson = CommonJson<'arguments'> & {
    arguments?: Omit<ExpressionListJson, 'sourceSpan'> | null;
};
export const isArgumentsJson = typia.createIs<ArgumentsJson>();
export const isArgumentsClass = (target: unknown): target is ArgumentsClass => {
    return target instanceof ArgumentsClass;
};

export class ArgumentsClass extends CommonBaseClass<'arguments', ArgumentsJson> {
    private arguments: ExpressionListClass | null | undefined;

    constructor(target: NormalArgumentsTypeClass) {
        const argument = assignClassWithNull(
            target.getValue(),
            (target: unknown) => isTargetTypeClass(target, isExpressionListType),
            (target: ExpressionListTypeClass) => new ExpressionListClass(target),
        );
        super(
            'arguments',
            !isErrorInfo(argument) && argument !== null
                ? { argument: argument.getSourceSpan() }
                : { content: target.getSpan()! },
            isErrorInfo(argument) ? argument : null,
        );
        this.arguments = !isErrorInfo(argument) ? (argument !== null ? argument : null) : undefined;
    }

    toJson(): ArgumentsJson {
        const json: ArgumentsJson = {
            type: 'arguments',
            sourceSpan: this.getSourceSpan(),
        };

        if (this.arguments !== undefined) {
            if (this.arguments) {
                const { sourceSpan, ...rest } = this.arguments.toJson();
                json.arguments = rest;
            } else {
                json.arguments = null;
            }
        }

        return json;
    }
}

export type TypeArgumentsJson = CommonJson<'typeArguments'> & {
    typeArguments?: Omit<TypeListJson, 'sourceSpan'> | null;
};
export const isTypeArgumentsJson = typia.createIs<TypeArgumentsJson>();

export const isTypeArgumentsClass = (target: unknown): target is TypeArgumentsClass => {
    return target instanceof TypeArgumentsClass;
};

export class TypeArgumentsClass extends CommonBaseClass<'typeArguments', TypeArgumentsJson> {
    private typeArguments: TypeListClass | null | undefined;

    constructor(target: TypeArgumentsTypeClass) {
        const typeArguments = assignClassWithNull(
            target.getValue(),
            (target: unknown) => isTargetTypeClass(target, isTypeListType),
            (typeClass: TypeListTypeClass) => new TypeListClass(typeClass),
        );
        super(
            'typeArguments',
            !isErrorInfo(typeArguments) && typeArguments !== null
                ? { typeArguments: typeArguments.getSourceSpan() }
                : { content: target.getSpan()! },
            isErrorInfo(typeArguments) ? typeArguments : null,
        );
        this.typeArguments = !isErrorInfo(typeArguments)
            ? typeArguments !== null
                ? typeArguments
                : null
            : undefined;
    }

    toJson(): TypeArgumentsJson {
        const json: TypeArgumentsJson = {
            type: 'typeArguments',
            sourceSpan: this.getSourceSpan(),
        };

        if (this.typeArguments !== undefined) {
            if (this.typeArguments) {
                const { sourceSpan, ...rest } = this.typeArguments.toJson();
                json.typeArguments = rest;
            } else {
                json.typeArguments = null;
            }
        }

        return json;
    }
}
