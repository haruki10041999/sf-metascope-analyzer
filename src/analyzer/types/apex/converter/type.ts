import typia from 'typia';

import {
    ArraySubscriptsTypeClass,
    TypeRefTypeClass,
    isArraySubscriptsType,
    isTypeNameType,
    TypeNameTypeClass,
} from '../../apex_IR';

import {
    toPrimitiveValue,
    SourceSpanInfo,
    CommonBaseClass,
    ElementBaseClass,
    CommonJson,
    ErrorInfo,
    isErrorInfo,
    assignClass,
    assignClassWithNull,
    assignClassToElementClass,
    assignElementClass,
    isTargetTypeClass,
    assignMultiClass,
    assignClassArray,
} from './commons';
import { TypeNameClass, TypeNameJson } from './name';

export type ArraySubscriptsJson = CommonJson<'arraySubscripts'> & {
    arraySubscripts: number | null;
};
export const isArraySubscriptsJson = typia.createIs<ArraySubscriptsJson>();

export const isArraySubscriptsClass = (target: unknown): target is ArraySubscriptsClass => {
    return target instanceof ArraySubscriptsClass;
};

class ArraySubscriptsClass extends CommonBaseClass<'arraySubscripts', ArraySubscriptsJson> {
    private arraySubscripts: number | null;

    constructor(target: ArraySubscriptsTypeClass) {
        const arraySubscripts = toPrimitiveValue(target.getValue(), isNumber);
        super(
            'arraySubscripts',
            target.getSpan()!,
            isErrorInfo(arraySubscripts) ? arraySubscripts : null,
        );
        this.arraySubscripts = !isErrorInfo(arraySubscripts) ? arraySubscripts : null;
    }

    toJson(): ArraySubscriptsJson {
        return {
            type: 'arraySubscripts',
            arraySubscripts: this.arraySubscripts,
            sourceSpan: this.getSourceSpan(),
        };
    }
}

export const isNumber = (target: any): target is number => {
    return typeof target === 'number';
};

export const isNumberArray = (target: any): target is number[] => {
    return Array.isArray(target) && target.every((t) => isNumber(t));
};

export type TypeRefJson = CommonJson<'typeRef'> & {
    types: (Omit<TypeNameJson, 'sourceSpan'> | null)[];
    arrayDimention?: Omit<ArraySubscriptsJson, 'sourceSpan'> | null;
};
export const isTypeRefJson = typia.createIs<TypeRefJson>();

export const isTypeRefClass = (target: unknown): target is TypeRefClass => {
    return target instanceof TypeRefClass;
};

export class TypeRefClass extends CommonBaseClass<'typeRef', TypeRefJson> {
    private types: (TypeNameClass | null)[];
    private arrayDimention: ArraySubscriptsClass | null | undefined;

    constructor(target: TypeRefTypeClass) {
        const types: (TypeNameClass | null)[] = [];
        let sourceSpan: SourceSpanInfo = {};
        const sourceSpanArray: SourceSpanInfo[] = [];
        const errorInfo: ErrorInfo[] = [];
        let assignIndex = 0;

        const type = assignClassArray(
            target.getValue(),
            (target: unknown) => isTargetTypeClass(target, isTypeNameType),
            (typeClass: TypeNameTypeClass) => new TypeNameClass(typeClass),
        );
        type.forEach((t) => {
            if (isErrorInfo(t)) {
                errorInfo.push(t);
                types.push(null);
            } else {
                types.push(t);
                sourceSpanArray.push({
                    type: t.getSourceSpan(),
                });
                assignIndex++;
            }
        });

        if (sourceSpanArray.length > 0) {
            sourceSpan = { ...sourceSpan, type: sourceSpanArray };
        }

        const arrayDimention = assignClassWithNull(
            target.getDimension(),
            (target: unknown) => isTargetTypeClass(target, isArraySubscriptsType),
            (typeClass: ArraySubscriptsTypeClass) => new ArraySubscriptsClass(typeClass),
        );
        if (isErrorInfo(arrayDimention)) {
            errorInfo.push(arrayDimention);
        } else if (isArraySubscriptsClass(arrayDimention)) {
            sourceSpan = {
                ...sourceSpan,
                arrayDimention: arrayDimention.getSourceSpan(),
            };
            assignIndex++;
        }

        super(
            'typeRef',
            Object.keys(sourceSpan).length + sourceSpanArray.length - 1 !== assignIndex
                ? { content: target.getSpan()!, ...sourceSpan }
                : sourceSpanArray,
            errorInfo,
        );
        this.types = types;
        this.arrayDimention = !isErrorInfo(arrayDimention)
            ? arrayDimention !== null
                ? arrayDimention
                : null
            : undefined;
    }

    toJson(): TypeRefJson {
        const json: TypeRefJson = {
            type: 'typeRef',
            types: this.types.map((t) => {
                if (t) {
                    const { sourceSpan, ...rest } = t.toJson();
                    return rest;
                }
                return null;
            }),
            sourceSpan: this.getSourceSpan(),
        };

        if (this.arrayDimention !== undefined) {
            if (this.arrayDimention) {
                const { sourceSpan, ...rest } = this.arrayDimention.toJson();
                json.arrayDimention = rest;
            } else {
                json.arrayDimention = this.arrayDimention;
            }
        }

        return json;
    }
}
