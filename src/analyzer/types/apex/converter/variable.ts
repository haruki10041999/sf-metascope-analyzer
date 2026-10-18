import typia from 'typia';

import {
    ArrayInitializerTypeClass,
    VariableDeclaratorTypeClass,
    VariableDeclaratorsTypeClass,
    isNormalIdType,
    isVariableDeclaratorType,
    NormalIdTypeClass,
} from '../../apex_IR';
import {
    SourceSpanInfo,
    assignElementClass,
    assignElementClassWithNull,
    assignClass,
    assignClassArray,
    CommonJson,
    ErrorInfo,
    isErrorInfo,
    CommonBaseClass,
    isTargetTypeClass,
} from './commons';
import {
    AllExpressionJson,
    AllExpressionClass,
    isExpressionTypeClass,
    expressionRules,
    isAllExpressionClass,
} from './expression';
import { IdClass, IdJson } from './id';

export type ArrayInitializerJson = CommonJson<'arrayInitializer'> & {
    arrayInitializer: (Omit<AllExpressionJson, 'sourceSpan'> | null)[];
};
export const isArrayInitializerJson = typia.createIs<ArrayInitializerJson>();

export const isArrayInitializerClass = (target: unknown): target is ArrayInitializerClass => {
    return target instanceof ArrayInitializerClass;
};

export class ArrayInitializerClass extends CommonBaseClass<
    'arrayInitializer',
    ArrayInitializerJson
> {
    private arrayInitializer: (AllExpressionClass | null)[];

    constructor(target: ArrayInitializerTypeClass) {
        const arrayInitializer: (AllExpressionClass | null)[] = [];
        const sourceSpanArray: SourceSpanInfo[] = [];
        const errorInfo: ErrorInfo[] = [];

        target.getValue().forEach((value) => {
            const expressionValue = assignElementClass(
                value,
                isExpressionTypeClass,
                expressionRules,
            );
            if (isErrorInfo(expressionValue)) {
                errorInfo.push(expressionValue);
                arrayInitializer.push(null);
            } else {
                sourceSpanArray.push({
                    arrayInitializer: expressionValue.getSourceSpan(),
                });
                arrayInitializer.push(expressionValue);
            }
        });

        super(
            'arrayInitializer',
            sourceSpanArray.length !== arrayInitializer.filter((e) => e !== null).length
                ? { content: target.getSpan()!, soslId: sourceSpanArray }
                : sourceSpanArray,
            errorInfo,
        );
        this.arrayInitializer = arrayInitializer;
    }

    toJson(): ArrayInitializerJson {
        return {
            type: 'arrayInitializer',
            arrayInitializer: this.arrayInitializer.map((expressionClass) => {
                if (expressionClass) {
                    const { sourceSpan, ...rest } = expressionClass.toJson();
                    return rest;
                }
                return null;
            }),
            sourceSpan: this.getSourceSpan(),
        };
    }
}

export type VariableDeclaratorJson = CommonJson<'variableDeclarator'> & {
    name: Omit<IdJson, 'sourceSpan'> | null;
    initValue?: Omit<AllExpressionJson, 'sourceSpan'> | null;
};
export const isVariableDeclaratorJson = typia.createIs<VariableDeclaratorJson>();

export const isVariableDeclaratorClass = (target: unknown): target is VariableDeclaratorClass => {
    return target instanceof VariableDeclaratorClass;
};

export class VariableDeclaratorClass extends CommonBaseClass<
    'variableDeclarator',
    VariableDeclaratorJson
> {
    private name: IdClass | null;
    private initValue: AllExpressionClass | null | undefined;

    constructor(target: VariableDeclaratorTypeClass) {
        let sourceSpan: SourceSpanInfo = {};
        const errorInfo: ErrorInfo[] = [];
        let assignIndex = 0;

        const name = assignClass(
            target.getValue(),
            (target: unknown): target is NormalIdTypeClass =>
                isTargetTypeClass(target, isNormalIdType),
            (typeClass: NormalIdTypeClass) => new IdClass(typeClass),
        );
        if (isErrorInfo(name)) {
            errorInfo.push(name);
        } else {
            sourceSpan = { ...sourceSpan, name: name.getSourceSpan() };
            assignIndex++;
        }

        const initValue = assignElementClassWithNull(
            target.getContent(),
            isExpressionTypeClass,
            expressionRules,
        );
        if (isErrorInfo(initValue)) {
            errorInfo.push(initValue);
        } else if (isAllExpressionClass(initValue)) {
            sourceSpan = { ...sourceSpan, initValue: initValue.getSourceSpan() };
            assignIndex++;
        }

        super(
            'variableDeclarator',
            Object.keys(sourceSpan).length === assignIndex
                ? sourceSpan
                : { ...sourceSpan, content: target.getSpan()! },
            errorInfo,
        );
        this.name = !isErrorInfo(name) ? name : null;
        this.initValue = !isErrorInfo(initValue)
            ? initValue !== null
                ? initValue
                : null
            : undefined;
    }
    toJson(): VariableDeclaratorJson {
        let name: Omit<IdJson, 'sourceSpan'> | null = null;
        if (this.name) {
            const { sourceSpan, ...rest } = this.name.toJson();
            name = rest;
        }

        const json: VariableDeclaratorJson = {
            type: 'variableDeclarator',
            sourceSpan: this.getSourceSpan(),
            name: name,
        };

        if (this.initValue !== undefined) {
            if (this.initValue) {
                const { sourceSpan, ...rest } = this.initValue.toJson();
                json.initValue = rest;
            } else {
                json.initValue = this.initValue;
            }
        }

        return json;
    }
}

export type VariableDeclaratorsJson = CommonJson<'variableDeclarators'> & {
    variableDeclators: (Omit<VariableDeclaratorJson, 'sourceSpan'> | null)[];
};
export const isVariableDeclaratorsJson = typia.createIs<VariableDeclaratorsJson>();

export const isVariableDeclaratorsClass = (target: unknown): target is VariableDeclaratorsClass => {
    return target instanceof VariableDeclaratorsClass;
};

export class VariableDeclaratorsClass extends CommonBaseClass<
    'variableDeclarators',
    VariableDeclaratorsJson
> {
    private variableDeclators: (VariableDeclaratorClass | null)[];

    constructor(target: VariableDeclaratorsTypeClass) {
        const variableDeclators: (VariableDeclaratorClass | null)[] = [];
        const sourceSpanArray: SourceSpanInfo[] = [];
        const errorInfo: ErrorInfo[] = [];

        const assignList = assignClassArray(
            target.getValue(),
            (target: unknown): target is VariableDeclaratorTypeClass =>
                isTargetTypeClass(target, isVariableDeclaratorType),
            (typeClass: VariableDeclaratorTypeClass) => new VariableDeclaratorClass(typeClass),
        );

        assignList.forEach((value) => {
            if (isErrorInfo(value)) {
                errorInfo.push(value);
                variableDeclators.push(null);
            } else {
                variableDeclators.push(value);
                sourceSpanArray.push({ variableDesclators: value.getSourceSpan() });
            }
        });

        super(
            'variableDeclarators',
            sourceSpanArray.length !== variableDeclators.filter((v) => v !== null).length
                ? { content: target.getSpan()!, variableDesclators: sourceSpanArray }
                : sourceSpanArray,
            errorInfo,
        );
        this.variableDeclators = variableDeclators;
    }
    toJson(): VariableDeclaratorsJson {
        return {
            type: 'variableDeclarators',
            variableDeclators: this.variableDeclators.map((value) => {
                if (value) {
                    const { sourceSpan, ...rest } = value.toJson();
                    return rest;
                }
                return null;
            }),
            sourceSpan: this.getSourceSpan(),
        };
    }
}
