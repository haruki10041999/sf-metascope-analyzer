import { isDirective, type Directive } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
} from '../commonVisitor';
import { directiveLiteralTypePair, type DirectiveLiteralTypeClass } from './directiveLiteral';

const directiveValuePairs = lazyPairs(() => [directiveLiteralTypePair] as const);

export type DirectiveFields = {
    value: DirectiveLiteralTypeClass | LwcErrorTypeClass;
};

export class DirectiveTypeClass extends LwcCommonTypeClass<'directive'> {
    private readonly value: DirectiveFields;

    private constructor(value: DirectiveFields) {
        super('directive');
        this.value = value;
    }

    static create(target: Directive, originalSource: string): DirectiveTypeClass {
        return new DirectiveTypeClass({
            value: visitNode(
                target.value,
                originalSource,
                directiveValuePairs(),
                'Directive.value',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): DirectiveFields {
        return this.value;
    }

    getValue(): DirectiveFields['value'] {
        return this.value.value;
    }
}

export const directiveTypePair: EvaluatePair<Directive, DirectiveTypeClass> = makeEvaluatePair(
    isDirective,
    (target, originalSource) => DirectiveTypeClass.create(target, originalSource),
);

export const isDirectiveType = (target: LwcCommonTypeClass<string>): target is DirectiveTypeClass =>
    target instanceof DirectiveTypeClass;
