import typia from 'typia';

import {
    CommonTypeClass,
    ErrorTypeClass,
    MethodCallTypeClass,
    DotMethodCallTypeClass,
    isNormalIdType,
    isAnyIdType,
    isExpressionListType,
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
} from './commons';
import { IdClass, IdJson, AnyIdClass, AnyIdJson } from './id';
import {
    ExpressionElementClass,
    AllExpressionJson,
    AllExpressionClass,
    isExpressionTypeClass,
} from './expression';
import { ExpressionListClass, ExpressionListJson } from './list';

export type MethodCallJson = CommonJson<'methodCall'> & {
    member?: Omit<IdJson, 'sourceSpan'>;
    param?: Omit<ExpressionListJson, 'sourceSpan'>;
    reference?: string;
};
export const isMethodCallJson = typia.createIs<MethodCallJson>();

export class MethodCallClass implements CommonClass<'methodCall', MethodCallJson> {
    private member: IdClass | null;
    private param: ExpressionListClass | null;
    private reference: string | null;
    private sourceSpan: SourceSpanInfo = {};
    private errorInfo: ErrorInfo[] = [];

    constructor(target: MethodCallTypeClass) {
        const member = target.getValue();
        if (member) {
            const memberClass = toTypeClass(member, isNormalIdType);
            if (isErrorInfo(memberClass)) {
                this.errorInfo.push(memberClass);
                this.member = null;
            } else {
                this.member = new IdClass(memberClass);
                this.sourceSpan = { ...this.sourceSpan, [member.getType()]: member.getSpan()! };
            }
        } else {
            this.member = null;
        }

        const param = target.getParam();
        if (param) {
            const paramClass = toTypeClass(param, isExpressionListType);
            if (isErrorInfo(paramClass)) {
                this.errorInfo.push(paramClass);
                this.param = null;
            } else {
                this.param = new ExpressionListClass(paramClass);
                this.sourceSpan = { ...this.sourceSpan, [param.getType()]: param.getSpan()! };
            }
        } else {
            this.param = null;
        }

        if (target.getReference()) {
            this.reference = target.getReference();
        } else {
            this.reference = null;
        }

        if (!('member' in this.sourceSpan) || !('param' in this.sourceSpan)) {
            this.sourceSpan = { content: target.getSpan()! };
        }
    }

    getErrorInfo(): ErrorInfo[] {
        return this.errorInfo;
    }

    getType(): 'methodCall' {
        return 'methodCall';
    }

    getSourceSpan(): SourceSpanInfo | SourceSpanInfo[] {
        return this.sourceSpan;
    }
    toJson(): MethodCallJson {
        const json: MethodCallJson = {
            type: 'methodCall',
            sourceSpan: this.sourceSpan,
        };

        if (this.member) {
            const { sourceSpan, ...rest } = this.member.toJson();
            json.member = rest;
        }

        if (this.param) {
            const { sourceSpan, ...rest } = this.param.toJson();
            json.param = rest;
        }

        if (this.reference) {
            json.reference = this.reference;
        }

        return json;
    }
}

export type DotMethodCallJson = CommonJson<'dotMethodCall'> & {
    member?: Omit<AnyIdJson, 'sourceSpan'>;
    param?: Omit<ExpressionListJson, 'sourceSpan'>;
};
export const isDotMethodCallJson = typia.createIs<DotMethodCallJson>();

export class DotMethodCallClass implements CommonClass<'dotMethodCall', DotMethodCallJson> {
    private member: AnyIdClass | null;
    private param: ExpressionListClass | null;
    private sourceSpan: SourceSpanInfo = {};
    private errorInfo: ErrorInfo[] = [];

    constructor(target: DotMethodCallTypeClass) {
        const memberClass = toTypeClass(target.getValue(), isAnyIdType);
        if (isErrorInfo(memberClass)) {
            this.errorInfo.push(memberClass);
            this.member = null;
        } else {
            this.member = new AnyIdClass(memberClass);
            this.sourceSpan = {
                ...this.sourceSpan,
                [this.member.getType()]: this.member.getSourceSpan()!,
            };
        }

        const param = target.getParam();
        if (param) {
            const paramClass = toTypeClass(param, isExpressionListType);
            if (isErrorInfo(paramClass)) {
                this.errorInfo.push(paramClass);
                this.param = null;
            } else {
                this.param = new ExpressionListClass(paramClass);
                this.sourceSpan = {
                    ...this.sourceSpan,
                    [this.param.getType()]: this.param.getSourceSpan()!,
                };
            }
        } else {
            this.param = null;
        }

        if (!('member' in this.sourceSpan)) {
            this.sourceSpan = { content: target.getSpan()! };
        }
    }

    getErrorInfo(): ErrorInfo[] {
        return this.errorInfo;
    }

    getType(): 'dotMethodCall' {
        return 'dotMethodCall';
    }

    getSourceSpan(): SourceSpanInfo | SourceSpanInfo[] {
        return this.sourceSpan;
    }
    toJson(): DotMethodCallJson {
        const json: DotMethodCallJson = {
            type: 'dotMethodCall',
            sourceSpan: this.sourceSpan,
        };

        if (this.member) {
            const { sourceSpan, ...rest } = this.member.toJson();
            json.member = rest;
        }

        if (this.param) {
            const { sourceSpan, ...rest } = this.param.toJson();
            json.param = rest;
        }

        return json;
    }
}
