import typia from 'typia';

import {
    ErrorTypeClass,
    ArrayCreatorRestTypeClass,
    ClassCreatorRestTypeClass,
    CreatorTypeClass,
    MapCreatorRestTypeClass,
    NoRestTypeClass,
    SetCreatorRestTypeClass,
    isArrayCreatorRestType,
    isArrayInitializerType,
    isClassCreatorRestType,
    isCreatedNameType,
    isExpressionTypeAll,
    isMapCreatorRestPairType,
    isMapCreatorRestType,
    isNoRestType,
    isNormalArgumentsType,
    isRestTypeAll,
    isSetCreatorRestType,
    ArrayInitializerTypeClass,
    NormalArgumentsTypeClass,
    MapCreatorRestPairTypeClass,
    CommonTypeClass,
    CreatedNameTypeClass,
} from '../../apex_IR';

import {
    toPrimitiveValue,
    toTypeClass,
    SourceSpanInfo,
    CommonClass,
    ElementClass,
    CommonJson,
    ErrorInfo,
    isErrorInfo,
    assignClass,
    assignClassWithNull,
    assignClassToElementClass,
    isTargetTypeClass,
    assignMultiClass,
    CommonBaseClass,
    assignElementClassWithNull,
    assignClassArray,
    assignElementClass,
    ElementBaseClass,
} from './commons';
import { ArgumentsClass, ArgumentsJson } from './arguments';
import {
    AllExpressionJson,
    AllExpressionClass,
    isExpressionTypeClass,
    expressionRules,
    isAllExpressionClass,
} from './expression';
import { CreatedNameClass, CreatedNameJson } from './name';
import { MapCreatorRestPairClass, MapCreatorRestPairJson } from './pair';
import { ArrayInitializerClass, ArrayInitializerJson, isArrayInitializerClass } from './variable';
import { isError } from 'postcss/lib/css-syntax-error';
import { isString } from './id';

export type ArrayCreatorRestJson = CommonJson<'arrayCreatorRest'> & {
    array?: Omit<ArrayInitializerJson, 'sourceSpan'> | null;
    size?: Omit<AllExpressionJson, 'sourceSpan'> | null;
};
export const isArrayCreatorRestJson = typia.createIs<ArrayCreatorRestJson>();
export const isArrayCreatorRestClass = (target: unknown): target is ArrayCreatorRestClass => {
    return target instanceof ArrayCreatorRestClass;
};

export class ArrayCreatorRestClass extends CommonBaseClass<
    'arrayCreatorRest',
    ArrayCreatorRestJson
> {
    private array: ArrayInitializerClass | null | undefined;
    private size: AllExpressionClass | null | undefined;

    constructor(target: ArrayCreatorRestTypeClass) {
        let sourceSpan: SourceSpanInfo = {};
        const errorInfo: ErrorInfo[] = [];
        let assignIndex = 0;

        const array = assignClassWithNull(
            target.getValue(),
            (target: unknown) => isTargetTypeClass(target, isArrayInitializerType),
            (typeClass: ArrayInitializerTypeClass) => new ArrayInitializerClass(typeClass),
        );
        if (isErrorInfo(array)) {
            errorInfo.push(array);
        } else if (isArrayInitializerClass(array)) {
            sourceSpan = { ...sourceSpan, array: array.getSourceSpan() };
            assignIndex++;
        }

        const size = assignElementClassWithNull(
            target.getSize(),
            isExpressionTypeClass,
            expressionRules,
        );
        if (isErrorInfo(size)) {
            errorInfo.push(size);
        } else if (isAllExpressionClass(size)) {
            sourceSpan = {
                ...sourceSpan,
                size: size.getSourceSpan(),
            };
            assignIndex++;
        }

        super(
            'arrayCreatorRest',
            Object.keys(sourceSpan).length === assignIndex
                ? sourceSpan
                : { ...sourceSpan, content: target.getSpan()! },
            errorInfo,
        );
        this.array = !isErrorInfo(array) ? (array !== null ? array : null) : undefined;
        this.size = !isErrorInfo(size) ? (size !== null ? size : null) : undefined;
    }

    toJson(): ArrayCreatorRestJson {
        const json: ArrayCreatorRestJson = {
            type: 'arrayCreatorRest',
            sourceSpan: this.getSourceSpan(),
        };

        if (this.array !== undefined) {
            if (this.array) {
                const { sourceSpan, ...rest } = this.array.toJson();
                json.array = rest;
            } else {
                json.array = this.array;
            }
        }

        if (this.size !== undefined) {
            if (this.size) {
                const { sourceSpan, ...rest } = this.size.toJson();
                json.size = rest;
            } else {
                json.size = this.size;
            }
        }

        return json;
    }
}

export type ClassCreatorRestJson = CommonJson<'classCreatorRest'> & {
    classCreatorRest: Omit<ArgumentsJson, 'sourceSpan'> | null;
};
export const isClassCreatorRestJson = typia.createIs<ClassCreatorRestJson>();
export const isClassCreatorRestClass = (target: unknown): target is ClassCreatorRestClass => {
    return target instanceof ClassCreatorRestClass;
};

export class ClassCreatorRestClass extends CommonBaseClass<
    'classCreatorRest',
    ClassCreatorRestJson
> {
    private classCreatorRest: ArgumentsClass | null;

    constructor(target: ClassCreatorRestTypeClass) {
        const classCreatorRest = assignClass(
            target.getValue(),
            (target: unknown) => isTargetTypeClass(target, isNormalArgumentsType),
            (typeClass: NormalArgumentsTypeClass) => new ArgumentsClass(typeClass),
        );

        super(
            'classCreatorRest',
            isErrorInfo(classCreatorRest)
                ? { content: target.getSpan()! }
                : classCreatorRest.getSourceSpan(),
            isErrorInfo(classCreatorRest) ? classCreatorRest : null,
        );
        this.classCreatorRest = !isErrorInfo(classCreatorRest) ? classCreatorRest : null;
    }

    toJson(): ClassCreatorRestJson {
        if (this.classCreatorRest) {
            return {
                type: 'classCreatorRest',
                classCreatorRest: this.classCreatorRest.toJson(),
                sourceSpan: this.getSourceSpan(),
            };
        } else {
            return {
                type: 'classCreatorRest',
                classCreatorRest: null,
                sourceSpan: this.getSourceSpan(),
            };
        }
    }
}

export type MapCreatorRestJson = CommonJson<'mapCreatorRest'> & {
    mapCreatorRest: (Omit<MapCreatorRestPairJson, 'sourceSpan'> | null)[];
};
export const isMapCreatorRestJson = typia.createIs<MapCreatorRestJson>();
export const isMapCreatorRestClass = (target: unknown): target is MapCreatorRestClass => {
    return target instanceof MapCreatorRestClass;
};

export class MapCreatorRestClass extends CommonBaseClass<'mapCreatorRest', MapCreatorRestJson> {
    private mapCreatorRest: (MapCreatorRestPairClass | null)[];

    constructor(target: MapCreatorRestTypeClass) {
        const mapCreatorRest: (MapCreatorRestPairClass | null)[] = [];
        const sourceSpanArray: SourceSpanInfo[] = [];
        const errorInfo: ErrorInfo[] = [];

        const mapCreatorRestValue = assignClassArray(
            target.getValue(),
            (target: unknown) => isTargetTypeClass(target, isMapCreatorRestPairType),
            (typeClass: MapCreatorRestPairTypeClass) => new MapCreatorRestPairClass(typeClass),
        );
        mapCreatorRestValue.forEach((m) => {
            if (isErrorInfo(m)) {
                errorInfo.push(m);
                mapCreatorRest.push(null);
            } else {
                sourceSpanArray.push({ mapCreatorRest: m.getSourceSpan() });
                mapCreatorRest.push(m);
            }
        });

        super(
            'mapCreatorRest',
            sourceSpanArray.length !== mapCreatorRest.filter((m) => m !== null).length
                ? { content: target.getSpan()!, expressionList: sourceSpanArray }
                : sourceSpanArray,
            errorInfo,
        );
        this.mapCreatorRest = mapCreatorRest;
    }

    toJson(): MapCreatorRestJson {
        return {
            type: 'mapCreatorRest',
            mapCreatorRest: this.mapCreatorRest.map((m) => {
                if (m) {
                    const { sourceSpan, ...rest } = m.toJson();
                    return rest;
                }
                return null;
            }),
            sourceSpan: this.getSourceSpan(),
        };
    }
}

export type NoRestJson = CommonJson<'noRest'> & {
    noRest: string | null;
};
export const isNoRestJson = typia.createIs<NoRestJson>();

export const isNoRestclass = (target: unknown): target is NoRestclass => {
    return target instanceof NoRestclass;
};

export class NoRestclass extends CommonBaseClass<'noRest', NoRestJson> {
    private noRest: string | null;

    constructor(target: NoRestTypeClass) {
        const noRest = toPrimitiveValue(target.getValue(), isString);
        super('noRest', target.getSpan()!, isErrorInfo(noRest) ? noRest : null);
        this.noRest = !isErrorInfo(noRest) ? noRest : null;
    }

    toJson(): NoRestJson {
        return {
            type: 'noRest',
            noRest: this.noRest,
            sourceSpan: this.getSourceSpan(),
        };
    }
}

export type SetCreatorRestJson = CommonJson<'setCreatorRest'> & {
    setCreatorRest: (Omit<AllExpressionJson, 'sourceSpan'> | null)[];
};
export const isSetCreatorRestJson = typia.createIs<SetCreatorRestJson>();

export const isSetCreatorRestClass = (target: unknown): target is SetCreatorRestClass => {
    return target instanceof SetCreatorRestClass;
};

export class SetCreatorRestClass extends CommonBaseClass<'setCreatorRest', SetCreatorRestJson> {
    private setCreatorRest: (AllExpressionClass | null)[] = [];

    constructor(target: SetCreatorRestTypeClass) {
        const setCreatorRest: (AllExpressionClass | null)[] = [];
        const sourceSpanArray: SourceSpanInfo[] = [];
        const errorInfo: ErrorInfo[] = [];

        target.getValue().forEach((value) => {
            const expressionClass = assignElementClass(
                value,
                isExpressionTypeClass,
                expressionRules,
            );
            if (isErrorInfo(expressionClass)) {
                errorInfo.push(expressionClass);
                setCreatorRest.push(null);
            } else {
                setCreatorRest.push(expressionClass);
                sourceSpanArray.push({
                    expressionList: expressionClass.getSourceSpan(),
                });
            }
        });

        super(
            'setCreatorRest',
            sourceSpanArray.length !== setCreatorRest.filter((s) => s !== null).length
                ? { content: target.getSpan()!, expressionList: sourceSpanArray }
                : sourceSpanArray,
            errorInfo,
        );
        this.setCreatorRest = setCreatorRest;
    }
    toJson(): SetCreatorRestJson {
        return {
            type: 'setCreatorRest',
            setCreatorRest: this.setCreatorRest.map((s) => {
                if (s) {
                    const { sourceSpan, ...rest } = s.toJson();
                    return rest;
                }
                return null;
            }),
            sourceSpan: this.getSourceSpan(),
        };
    }
}

export type AllRestClass =
    | ArrayCreatorRestClass
    | ClassCreatorRestClass
    | MapCreatorRestClass
    | NoRestclass
    | SetCreatorRestClass;

export type AllRestJson =
    | ArrayCreatorRestJson
    | ClassCreatorRestJson
    | MapCreatorRestJson
    | NoRestJson
    | SetCreatorRestJson;

export const restRules = [
    {
        isValid: (target: unknown): target is ArrayCreatorRestTypeClass =>
            isTargetTypeClass(target, isArrayCreatorRestType),
        construct: (target: ArrayCreatorRestTypeClass) => new ArrayCreatorRestClass(target),
    },
    {
        isValid: (target: unknown): target is ClassCreatorRestTypeClass =>
            isTargetTypeClass(target, isClassCreatorRestType),
        construct: (target: ClassCreatorRestTypeClass) => new ClassCreatorRestClass(target),
    },
    {
        isValid: (target: unknown): target is MapCreatorRestTypeClass =>
            isTargetTypeClass(target, isMapCreatorRestType),
        construct: (target: MapCreatorRestTypeClass) => new MapCreatorRestClass(target),
    },
    {
        isValid: (target: unknown): target is NoRestTypeClass =>
            isTargetTypeClass(target, isNoRestType),
        construct: (target: NoRestTypeClass) => new NoRestclass(target),
    },
    {
        isValid: (target: unknown): target is SetCreatorRestTypeClass =>
            isTargetTypeClass(target, isSetCreatorRestType),
        construct: (target: SetCreatorRestTypeClass) => new SetCreatorRestClass(target),
    },
] as const;

export class RestElementClass extends ElementBaseClass<
    [
        | ArrayCreatorRestTypeClass
        | ClassCreatorRestTypeClass
        | MapCreatorRestTypeClass
        | NoRestTypeClass
        | SetCreatorRestTypeClass,
    ],
    typeof restRules
> {}

export const isRestTypeClass = (
    target: any,
): target is
    | ArrayCreatorRestTypeClass
    | ClassCreatorRestTypeClass
    | MapCreatorRestTypeClass
    | NoRestTypeClass
    | SetCreatorRestTypeClass => {
    // | SoqlPrimaryTypeClass
    // | LiteralPrimaryTypeClass
    // | TypeRefPrimaryTypeClass
    // | SoslPrimaryTypeClass => {

    return (
        target instanceof CommonTypeClass &&
        (isArrayCreatorRestType(target) ||
            isClassCreatorRestType(target) ||
            isMapCreatorRestType(target) ||
            isNoRestType(target) ||
            isSetCreatorRestType(target))
        // isSoslPrimaryType(target) ||
        // isLiteralPrimaryType(target) ||
        // isTypeRefPrimaryType(target) ||
        // isSoqlPrimaryType(target)
    );
};

export const isAllRestClass = (target: unknown): target is AllRestClass => {
    return (
        isArrayCreatorRestClass(target) ||
        isClassCreatorRestClass(target) ||
        isMapCreatorRestClass(target) ||
        isNoRestclass(target) ||
        isSetCreatorRestClass(target)
    );
};

export type CreatorJson = CommonJson<'creator'> & {
    name: Omit<CreatedNameJson, 'sourceSpan'> | null;
    rest: Omit<AllRestJson, 'sourceSpan'> | null;
};
export const isCreatorJson = typia.createIs<CreatorJson>();
export const isCreatorClass = (target: unknown): target is CreatorClass => {
    return target instanceof CreatorClass;
};

export class CreatorClass extends CommonBaseClass<'creator', CreatorJson> {
    private name: CreatedNameClass | null;
    private rest: AllRestClass | null;

    constructor(target: CreatorTypeClass) {
        let sourceSpan: SourceSpanInfo = {};
        const errorInfo: ErrorInfo[] = [];
        let assignIndex = 0;

        const name = assignClass(
            target.getValue(),
            (target: unknown) => isTargetTypeClass(target, isCreatedNameType),
            (typeClass: CreatedNameTypeClass) => new CreatedNameClass(typeClass),
        );
        if (isErrorInfo(name)) {
            errorInfo.push(name);
        } else {
            sourceSpan = { ...sourceSpan, name: name.getSourceSpan() };
            assignIndex++;
        }

        const rest = assignElementClass(target.getValue(), isRestTypeClass, restRules);
        if (isErrorInfo(rest)) {
            errorInfo.push(rest);
        } else {
            sourceSpan = { ...sourceSpan, rest: rest.getSourceSpan() };
            assignIndex++;
        }

        super(
            'creator',
            Object.keys(sourceSpan).length === assignIndex
                ? sourceSpan
                : { ...sourceSpan, content: target.getSpan()! },
            errorInfo,
        );
        this.name = !isErrorInfo(name) ? name : null;
        this.rest = !isErrorInfo(rest) ? rest : null;
    }

    toJson(): CreatorJson {
        let name: Omit<CreatedNameJson, 'sourceSpan'> | null = null;
        if (this.name) {
            const { sourceSpan, ...rest } = this.name.toJson();
            name = rest;
        }

        let rest: Omit<AllRestJson, 'sourceSpan'> | null = null;
        if (this.rest) {
            const { sourceSpan, ...createdRest } = this.rest.toJson();
            rest = createdRest;
        }

        return {
            type: 'creator',
            name: name,
            rest: rest,
            sourceSpan: this.getSourceSpan(),
        };
    }
}
