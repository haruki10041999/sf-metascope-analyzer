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
    SourceSpanInfo,
    CommonBaseClass,
    ErrorInfo,
    CommonJson,
    assignClass,
    assignClassArray,
    isTargetTypeClass,
    isErrorInfo,
} from './commons';

export type IdJson = CommonJson<'id'> & {
    id: string;
};
export const isIdJson = typia.createIs<IdJson>();

export const isIdClass = (target: unknown): target is IdClass => {
    return target instanceof IdClass;
};

export class IdClass extends CommonBaseClass<'id', IdJson> {
    private id: string;

    constructor(target: NormalIdTypeClass) {
        super('id', target.getSpan()!, null);
        this.id = target.getValue();
    }

    toJson(): IdJson {
        return {
            type: 'id',
            id: this.id,
            sourceSpan: this.getSourceSpan(),
        };
    }
}

export type AnyIdJson = CommonJson<'anyId'> & {
    anyId: string;
};
export const isAnyIdJson = typia.createIs<AnyIdJson>();

export const isAnyIdClass = (target: unknown): target is AnyIdClass => {
    return target instanceof AnyIdClass;
};

export class AnyIdClass extends CommonBaseClass<'anyId', AnyIdJson> {
    private anyId: string;

    constructor(target: AnyIdTypeClass) {
        super('anyId', target.getSpan()!, null);
        this.anyId = target.getValue();
    }

    toJson(): AnyIdJson {
        return {
            type: 'anyId',
            anyId: this.anyId,
            sourceSpan: this.getSourceSpan(),
        };
    }
}

export type SoqlIdJson = CommonJson<'soqlId'> & { soqlId: Omit<IdJson, 'sourceSpan'> | null };
export const isSoqlIdJson = typia.createIs<SoqlIdJson>();

export const isSoqlIdClass = (target: unknown): target is SoqlIdClass => {
    return target instanceof SoqlIdClass;
};

export class SoqlIdClass extends CommonBaseClass<'soqlId', SoqlIdJson> {
    private soqlId: IdClass | null;

    constructor(target: SoqlIdTypeClass) {
        const id = assignClass(
            target.getValue(),
            (target: unknown): target is NormalIdTypeClass =>
                isTargetTypeClass(target, isNormalIdType),
            (typeClass: NormalIdTypeClass) => new IdClass(typeClass),
        );
        super(
            'soqlId',
            isErrorInfo(id) ? target.getSpan()! : { soqlId: id.getSourceSpan() },
            isErrorInfo(id) ? id : null,
        );
        this.soqlId = !isErrorInfo(id) ? id : null;
    }

    toJson(): SoqlIdJson {
        if (this.soqlId) {
            const { sourceSpan, ...id } = this.soqlId.toJson();
            return {
                type: 'soqlId',
                soqlId: id,
                sourceSpan: this.getSourceSpan(),
            };
        } else {
            return {
                type: 'soqlId',
                soqlId: null,
                sourceSpan: this.getSourceSpan(),
            };
        }
    }
}

export type SoslIdJson = CommonJson<'soslId'> & { soslId: (Omit<IdJson, 'sourceSpan'> | null)[] };
export const isSoslIdJson = typia.createIs<SoslIdJson>();

export const isSoslClass = (target: unknown): target is SoslIdClass => {
    return target instanceof SoslIdClass;
};

export class SoslIdClass extends CommonBaseClass<'soslId', SoslIdJson> {
    private soslId: (IdClass | null)[] = [];

    constructor(target: SoslIdTypeClass) {
        const soslId: (IdClass | null)[] = [];
        const sourceSpanArray: SourceSpanInfo[] = [];
        const errorInfo: ErrorInfo[] = [];

        const assignList = assignClassArray(
            target.getValue(),
            (target: unknown): target is NormalIdTypeClass =>
                isTargetTypeClass(target, isNormalIdType),
            (typeClass: NormalIdTypeClass) => new IdClass(typeClass),
        );

        assignList.forEach((id) => {
            if (isErrorInfo(id)) {
                errorInfo.push(id);
                soslId.push(null);
            } else {
                soslId.push(id);
                sourceSpanArray.push({ soslId: id.getSourceSpan() });
            }
        });

        super(
            'soslId',
            sourceSpanArray.length !== soslId.length
                ? { content: target.getSpan()!, soslId: sourceSpanArray }
                : sourceSpanArray,
            errorInfo,
        );
        this.soslId = soslId;
    }

    toJson(): SoslIdJson {
        return {
            type: 'soslId',
            soslId: this.soslId.map((idClass) => {
                if (idClass) {
                    const { sourceSpan, ...rest } = idClass.toJson();
                    return rest;
                }
                return idClass;
            }),
            sourceSpan: this.getSourceSpan(),
        };
    }
}

export const isString = (target: any): target is string => {
    return typeof target === 'string';
};

export const isStringArray = (target: any): target is string[] => {
    return Array.isArray(target) && target.every((t) => isString(t));
};
