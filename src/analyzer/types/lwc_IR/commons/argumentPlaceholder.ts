import { type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isArgumentPlaceholder, type ArgumentPlaceholder } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    getSourceSpan,
} from '../commonVisitor';

export type ArgumentPlaceholderFields = TypeField<'argumentPlaceholder'>;

export class ArgumentPlaceholderTypeClass extends LwcCommonTypeClass<
    'argumentPlaceholder',
    ArgumentPlaceholderFields
> {
    private constructor(sourceSpan: SourceSpan) {
        super('argumentPlaceholder', {}, sourceSpan);
    }

    static create(
        target: ArgumentPlaceholder,
        originalSource: string,
    ): ArgumentPlaceholderTypeClass {
        return new ArgumentPlaceholderTypeClass(getSourceSpan(target, originalSource));
    }
}

export const argumentPlaceholderTypePair: EvaluatePair<
    ArgumentPlaceholder,
    ArgumentPlaceholderTypeClass
> = makeEvaluatePair(isArgumentPlaceholder, (target, originalSource) =>
    ArgumentPlaceholderTypeClass.create(target, originalSource),
);

export const isArgumentPlaceholderType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is ArgumentPlaceholderTypeClass => target instanceof ArgumentPlaceholderTypeClass;
