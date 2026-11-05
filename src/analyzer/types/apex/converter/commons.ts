// Apex の converter だけの部品 (apex_IR の TypeClass から作るもの)。
// 出力の共通の型 (CommonType / ErrorType / SourceInfo / ValueRuleValue) は LWC と共通の types/commons/converter.ts
import { ApexCommonTypeClass, ApexErrorTypeClass } from '../../apex_IR';
import type { ErrorType, SourceInfo } from '../../commons/converter';

// span は ApexCommonVisitor.visit() が必ず設定する
export const makeSourceInfo = (typeClass: ApexCommonTypeClass<string>): SourceInfo => {
    const span = typeClass.getSpan()!;
    return { context: span.context, start: span.start, end: span.end };
};

export const makeErrorType = (typeClass: ApexErrorTypeClass): ErrorType => {
    return {
        type: 'error',
        errorCode: typeClass.getCode(),
        contextType: typeClass.getContextType(),
        sourceInfo: makeSourceInfo(typeClass),
    };
};
