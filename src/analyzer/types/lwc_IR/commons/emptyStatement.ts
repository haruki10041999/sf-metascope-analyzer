import { type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isEmptyStatement, type EmptyStatement } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    getSourceSpan,
} from '../commonVisitor';

export type EmptyStatementFields = TypeField<'emptyStatement'>;

export class EmptyStatementTypeClass extends LwcCommonTypeClass<
    'emptyStatement',
    EmptyStatementFields
> {
    private constructor(sourceSpan: SourceSpan) {
        super('emptyStatement', {}, sourceSpan);
    }

    static create(target: EmptyStatement, originalSource: string): EmptyStatementTypeClass {
        return new EmptyStatementTypeClass(getSourceSpan(target, originalSource));
    }
}

export const emptyStatementTypePair: EvaluatePair<EmptyStatement, EmptyStatementTypeClass> =
    makeEvaluatePair(isEmptyStatement, (target, originalSource) =>
        EmptyStatementTypeClass.create(target, originalSource),
    );

export const isEmptyStatementType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is EmptyStatementTypeClass => target instanceof EmptyStatementTypeClass;
