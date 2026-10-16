import typia from 'typia';

import {
    ErrorTypeClass,
    SourceSpan,
    NormalIdTypeClass,
    AnyIdTypeClass,
    SoqlIdTypeClass,
    SoslIdTypeClass,
    isNormalIdType,
} from '../../apex_IR';

import {
    toTypeClass,
    SourceSpanInfo,
    CommonClass,
    ErrorInfo,
    CommonJson,
    isErrorInfo,
} from './commons';

export type IdJson = CommonJson<'id'> & {
    id: string;
};
export const isIdJson = typia.createIs<IdJson>();

export class IdClass implements CommonClass<'id', IdJson> {
    private value: string;
    private sourceSpan: SourceSpanInfo;

    constructor(target: NormalIdTypeClass) {
        this.value = target.getValue();
        this.sourceSpan = {
            content: target.getSpan()!,
        };
    }

    getErrorInfo(): null {
        return null;
    }

    getType(): 'id' {
        return 'id';
    }

    getSourceSpan(): SourceSpanInfo {
        return this.sourceSpan;
    }

    toJson(): IdJson {
        return {
            type: 'id',
            id: this.value,
            sourceSpan: this.sourceSpan,
        };
    }
}

export type AnyIdJson = CommonJson<'anyId'> & {
    anyId: string;
};
export const isAnyIdJson = typia.createIs<AnyIdJson>();

export class AnyIdClass implements CommonClass<'anyId', AnyIdJson> {
    private value: string;
    private sourceSpan: SourceSpanInfo;

    constructor(target: AnyIdTypeClass) {
        this.value = target.getValue();
        this.sourceSpan = {
            content: target.getSpan()!,
        };
    }
    getErrorInfo(): null {
        return null;
    }

    getType(): 'anyId' {
        return 'anyId';
    }

    getSourceSpan(): SourceSpanInfo {
        return this.sourceSpan;
    }

    toJson(): AnyIdJson {
        return {
            type: 'anyId',
            anyId: this.value,
            sourceSpan: this.sourceSpan,
        };
    }
}

export type SoqlIdJson = CommonJson<'soqlId'> & { soqlId?: Omit<IdJson, 'sourceSpan'> };
export const isSoqlIdJson = typia.createIs<SoqlIdJson>();

export class SoqlIdClass implements CommonClass<'soqlId', SoqlIdJson> {
    private value: IdClass | null;
    private sourceSpan: SourceSpanInfo;
    private errorInfo: ErrorInfo | null;

    constructor(target: SoqlIdTypeClass) {
        const value = toTypeClass(target.getValue(), isNormalIdType);

        if (isErrorInfo(value)) {
            this.errorInfo = value;
            this.value = null;
            this.sourceSpan = { content: target.getSpan()! };
        } else {
            this.errorInfo = null;
            this.value = new IdClass(value);
            this.sourceSpan = { [this.value.getType()]: this.value.getSourceSpan() };
        }
    }

    getErrorInfo(): ErrorInfo | null {
        return this.errorInfo;
    }

    getType(): 'soqlId' {
        return 'soqlId';
    }

    getSourceSpan(): SourceSpanInfo {
        return this.sourceSpan;
    }

    toJson(): SoqlIdJson {
        const json: SoqlIdJson = {
            type: 'soqlId',
            sourceSpan: this.sourceSpan,
        };

        if (this.value) {
            const { sourceSpan, ...rest } = this.value.toJson();
            json.soqlId = rest;
        }

        return json;
    }
}

export type SoslIdJson = CommonJson<'soslId'> & { soslId: Omit<IdJson, 'sourceSpan'>[] };
export const isSoslIdJson = typia.createIs<SoslIdJson>();

export class SoslIdClass implements CommonClass<'soslId', SoslIdJson> {
    private value: IdClass[] = [];
    private sourceSpan: SourceSpanInfo | SourceSpanInfo[];
    private errorInfo: ErrorInfo[] = [];

    constructor(target: SoslIdTypeClass) {
        const sourceSpanArray: SourceSpanInfo[] = [];

        target.getValue().forEach((value) => {
            const normalIdValue = toTypeClass(value, isNormalIdType);
            if (isErrorInfo(normalIdValue)) {
                this.errorInfo.push(normalIdValue);
            } else {
                const idClass = new IdClass(normalIdValue);
                this.value.push(idClass);
                sourceSpanArray.push({ [idClass.getType()]: idClass.getSourceSpan() });
            }
        });

        if (sourceSpanArray.length > 0) {
            this.sourceSpan = sourceSpanArray;
        } else {
            this.sourceSpan = { content: target.getSpan()! };
        }
    }

    getErrorInfo(): ErrorInfo[] {
        return this.errorInfo;
    }

    getType(): 'soslId' {
        return 'soslId';
    }

    getSourceSpan(): SourceSpanInfo | SourceSpanInfo[] {
        return this.sourceSpan;
    }

    toJson(): SoslIdJson {
        return {
            type: 'soslId',
            sourceSpan: this.sourceSpan,
            soslId: this.value.map((idClass) => {
                const { sourceSpan, ...rest } = idClass.toJson();
                return rest;
            }),
        };
    }
}

export const isString = (target: any): target is string => {
    return typeof target === 'string';
};

export const isStringArray = (target: any): target is string[] => {
    return Array.isArray(target) && target.every((t) => isString(t));
};
