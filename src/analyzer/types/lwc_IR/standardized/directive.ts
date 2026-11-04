import { isDirective, type Directive } from '@babel/types';
import { EvaluatePair, LwcCommonTypeClass, makeEvaluatePair } from '../commonVisitor';

export class DirectiveTypeClass extends LwcCommonTypeClass<'directive'> {
    private constructor(originalSource: string) {
        super('directive', originalSource);
    }

    static create(target: Directive, originalSource: string): DirectiveTypeClass {
        throw new Error('DirectiveTypeClass.create is not implemented: ' + target.type);
    }
}

export const directiveTypePair: EvaluatePair<Directive, DirectiveTypeClass> = makeEvaluatePair(
    isDirective,
    (target, originalSource) => DirectiveTypeClass.create(target, originalSource),
);

export const isDirectiveType = (target: LwcCommonTypeClass<string>): target is DirectiveTypeClass =>
    target instanceof DirectiveTypeClass;
