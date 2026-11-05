import { isTSParameterProperty, type TSParameterProperty } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
    visitNodeList,
} from '../commonVisitor';
import {
    assignmentPatternTypePair,
    type AssignmentPatternTypeClass,
} from '../commons/assignmentPattern';
import { decoratorTypePair, type DecoratorTypeClass } from '../commons/decorator';
import { identifierTypePair, type IdentifierTypeClass } from '../commons/identifier';

const tSParameterPropertyParameterPairs = lazyPairs(
    () => [identifierTypePair, assignmentPatternTypePair] as const,
);
const tSParameterPropertyDecoratorsPairs = lazyPairs(() => [decoratorTypePair] as const);

export type TSParameterPropertyFields = {
    accessibility: NonNullable<TSParameterProperty['accessibility']> | null;
    readonly: NonNullable<TSParameterProperty['readonly']> | null;
    parameter: IdentifierTypeClass | AssignmentPatternTypeClass | LwcErrorTypeClass;
    override: NonNullable<TSParameterProperty['override']> | null;
    decorators: (DecoratorTypeClass | LwcErrorTypeClass)[] | null;
};

export class TSParameterPropertyTypeClass extends LwcCommonTypeClass<'tSParameterProperty'> {
    private readonly value: TSParameterPropertyFields;

    private constructor(value: TSParameterPropertyFields) {
        super('tSParameterProperty');
        this.value = value;
    }

    static create(
        target: TSParameterProperty,
        originalSource: string,
    ): TSParameterPropertyTypeClass {
        return new TSParameterPropertyTypeClass({
            accessibility: target.accessibility ?? null,
            readonly: target.readonly ?? null,
            parameter: visitNode(
                target.parameter,
                originalSource,
                tSParameterPropertyParameterPairs(),
                'TSParameterProperty.parameter',
            ),
            override: target.override ?? null,
            decorators:
                target.decorators == null
                    ? null
                    : visitNodeList(
                          target.decorators,
                          originalSource,
                          tSParameterPropertyDecoratorsPairs(),
                          'TSParameterProperty.decorators',
                      ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): TSParameterPropertyFields {
        return this.value;
    }

    getAccessibility(): TSParameterPropertyFields['accessibility'] {
        return this.value.accessibility;
    }

    getReadonly(): TSParameterPropertyFields['readonly'] {
        return this.value.readonly;
    }

    getParameter(): TSParameterPropertyFields['parameter'] {
        return this.value.parameter;
    }

    getOverride(): TSParameterPropertyFields['override'] {
        return this.value.override;
    }

    getDecorators(): TSParameterPropertyFields['decorators'] {
        return this.value.decorators;
    }
}

export const tSParameterPropertyTypePair: EvaluatePair<
    TSParameterProperty,
    TSParameterPropertyTypeClass
> = makeEvaluatePair(isTSParameterProperty, (target, originalSource) =>
    TSParameterPropertyTypeClass.create(target, originalSource),
);

export const isTSParameterPropertyType = (
    target: LwcCommonTypeClass<string>,
): target is TSParameterPropertyTypeClass => target instanceof TSParameterPropertyTypeClass;
