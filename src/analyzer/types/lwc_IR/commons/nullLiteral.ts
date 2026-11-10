import { type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isNullLiteral, type NullLiteral } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    getSourceSpan,
} from '../commonVisitor';

export type NullLiteralFields = TypeField<'nullLiteral'>;

export class NullLiteralTypeClass extends LwcCommonTypeClass<'nullLiteral', NullLiteralFields> {
    private constructor(sourceSpan: SourceSpan) {
        super('nullLiteral', {}, sourceSpan);
    }

    static create(target: NullLiteral, originalSource: string): NullLiteralTypeClass {
        return new NullLiteralTypeClass(getSourceSpan(target, originalSource));
    }
}

export const nullLiteralTypePair: EvaluatePair<NullLiteral, NullLiteralTypeClass> =
    makeEvaluatePair(isNullLiteral, (target, originalSource) =>
        NullLiteralTypeClass.create(target, originalSource),
    );

export const isNullLiteralType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is NullLiteralTypeClass => target instanceof NullLiteralTypeClass;
