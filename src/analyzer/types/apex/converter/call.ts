import typia from 'typia';

import {
    MethodCallTypeClass,
    DotMethodCallTypeClass,
    isNormalIdType,
    isAnyIdType,
    isExpressionListType,
    NormalIdTypeClass,
    ExpressionListTypeClass,
    AnyIdTypeClass,
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
import { IdClass, IdJson, isIdClass, AnyIdClass, AnyIdJson, isAnyIdClass } from './id';
import { ExpressionListClass, ExpressionListJson, isExpressionListClass } from './list';

export type MethodCallJson = CommonJson<'methodCall'> & {
    member?: Omit<IdJson, 'sourceSpan'> | null;
    param?: Omit<ExpressionListJson, 'sourceSpan'> | null;
    reference?: string;
};
export const isMethodCallJson = typia.createIs<MethodCallJson>();
export const isMethodCallClass = (target: unknown): target is MethodCallClass => {
    return target instanceof MethodCallClass;
};

export class MethodCallClass extends CommonBaseClass<'methodCall', MethodCallJson> {
    private member: IdClass | null | undefined;
    private param: ExpressionListClass | null | undefined;
    private reference: string | undefined;

    constructor(target: MethodCallTypeClass) {
        let sourceSpan: SourceSpanInfo = {};
        const errorInfo: ErrorInfo[] = [];
        let assignIndex = 0;

        const member = assignClassWithNull(
            target.getValue(),
            (target: unknown) => isTargetTypeClass(target, isNormalIdType),
            (typeClass: NormalIdTypeClass) => new IdClass(typeClass),
        );
        if (isErrorInfo(member)) {
            errorInfo.push(member);
        } else if (isIdClass(member)) {
            sourceSpan = { ...sourceSpan, member: member.getSourceSpan() };
            assignIndex++;
        }

        const param = assignClassWithNull(
            target.getParam(),
            (target: unknown) => isTargetTypeClass(target, isExpressionListType),
            (typeClass: ExpressionListTypeClass) => new ExpressionListClass(typeClass),
        );
        if (isErrorInfo(param)) {
            errorInfo.push(param);
        } else if (isExpressionListClass(param)) {
            sourceSpan = {
                ...sourceSpan,
                param: param.getSourceSpan(),
            };
            assignIndex++;
        }

        const reference = target.getReference();
        if (reference) {
            sourceSpan = {
                ...sourceSpan,
                reference: reference,
            };
            assignIndex++;
        }

        super(
            'methodCall',
            Object.keys(sourceSpan).length === assignIndex
                ? sourceSpan
                : { ...sourceSpan, content: target.getSpan()! },
            errorInfo,
        );
        this.member = !isErrorInfo(member) ? (member !== null ? member : null) : undefined;
        this.param = !isErrorInfo(param) ? (param !== null ? param : null) : undefined;
        this.reference = reference ?? undefined;
    }

    toJson(): MethodCallJson {
        const json: MethodCallJson = {
            type: 'methodCall',
            sourceSpan: this.getSourceSpan(),
        };

        if (this.member !== undefined) {
            if (this.member) {
                const { sourceSpan, ...rest } = this.member.toJson();
                json.member = rest;
            } else {
                json.member = this.member;
            }
        }

        if (this.param !== undefined) {
            if (this.param) {
                const { sourceSpan, ...rest } = this.param.toJson();
                json.param = rest;
            } else {
                json.param = this.param;
            }
        }

        if (this.reference) {
            json.reference = this.reference;
        }

        return json;
    }
}

export type DotMethodCallJson = CommonJson<'dotMethodCall'> & {
    member: Omit<AnyIdJson, 'sourceSpan'> | null;
    param?: Omit<ExpressionListJson, 'sourceSpan'> | null;
};
export const isDotMethodCallJson = typia.createIs<DotMethodCallJson>();
export const isDotMethodCallClass = (target: unknown): target is DotMethodCallClass => {
    return target instanceof DotMethodCallClass;
};

export class DotMethodCallClass extends CommonBaseClass<'dotMethodCall', DotMethodCallJson> {
    private member: AnyIdClass | null;
    private param: ExpressionListClass | null | undefined;

    constructor(target: DotMethodCallTypeClass) {
        let sourceSpan: SourceSpanInfo = {};
        const errorInfo: ErrorInfo[] = [];
        let assignIndex = 0;

        const member = assignClass(
            target.getValue(),
            (target: unknown): target is AnyIdTypeClass => isTargetTypeClass(target, isAnyIdType),
            (typeClass: AnyIdTypeClass): AnyIdClass => new AnyIdClass(typeClass),
        );
        if (isErrorInfo(member)) {
            errorInfo.push(member);
        } else {
            sourceSpan = {
                ...sourceSpan,
                member: member.getSourceSpan()!,
            };
            assignIndex++;
        }

        const param = assignClassWithNull(
            target.getParam(),
            (target: unknown) => isTargetTypeClass(target, isExpressionListType),
            (typeClass: ExpressionListTypeClass) => new ExpressionListClass(typeClass),
        );
        if (isErrorInfo(param)) {
            errorInfo.push(param);
        } else if (isExpressionListClass(param)) {
            sourceSpan = {
                ...sourceSpan,
                param: param.getSourceSpan(),
            };
            assignIndex++;
        }

        super(
            'dotMethodCall',
            Object.keys(sourceSpan).length === assignIndex
                ? sourceSpan
                : { ...sourceSpan, content: target.getSpan()! },
            errorInfo,
        );
        this.member = !isErrorInfo(member) ? member : null;
        this.param = !isErrorInfo(param) ? param : param === null ? null : undefined;
    }

    toJson(): DotMethodCallJson {
        let json: DotMethodCallJson;
        if (this.member) {
            const { sourceSpan, ...member } = this.member.toJson();

            json = {
                type: 'dotMethodCall',
                member: member,
                sourceSpan: this.getSourceSpan(),
            };
        } else {
            json = {
                type: 'dotMethodCall',
                member: null,
                sourceSpan: this.getSourceSpan(),
            };
        }

        if (this.param !== undefined) {
            if (this.param) {
                const { sourceSpan, ...rest } = this.param.toJson();
                json.param = rest;
            } else {
                json.param = null;
            }
        }

        return json;
    }
}
