import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isTSParameterProperty, type TSParameterProperty } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
    getSourceSpan,
} from '../commonVisitor';
import { failIrBuild } from '../buildFailure';
import {
    assignmentPatternTypePair,
    type AssignmentPatternTypeClass,
} from '../commons/assignmentPattern';
import { DecoratorTypeClass } from '../commons/decorator';
import { identifierTypePair, type IdentifierTypeClass } from '../commons/identifier';

const tSParameterPropertyParameterPairs = lazyPairs(
    () => [identifierTypePair, assignmentPatternTypePair] as const,
);

/**
 * パラメータプロパティ (`constructor(private x)`) は、修飾子が少なくとも 1 つ付いた引数。
 * accessibility がある・readonly が付く・override が付く、のどれか
 */
type TSParameterPropertyModifierFields =
    | {
          accessibility: NonNullable<TSParameterProperty['accessibility']>;
          readonly: boolean;
          override: boolean;
      }
    | { accessibility: null; readonly: true; override: boolean }
    | { accessibility: null; readonly: false; override: true };

export type TSParameterPropertyFields = TypeField<'tSParameterProperty'> & {
    parameter: IdentifierTypeClass | AssignmentPatternTypeClass;
    decorators: DecoratorTypeClass[] | null;
} & TSParameterPropertyModifierFields;

const createModifierFields = (
    target: TSParameterProperty,
    originalSource: string,
): TSParameterPropertyModifierFields => {
    const readonly = target.readonly ?? false;
    const override = target.override ?? false;
    if (target.accessibility != null) {
        return { accessibility: target.accessibility, readonly, override };
    }
    if (readonly) {
        return { accessibility: null, readonly: true, override };
    }
    if (override) {
        return { accessibility: null, readonly: false, override: true };
    }
    return failIrBuild(
        'TYPE_MISMATCH',
        target,
        originalSource,
        'パラメータプロパティには accessibility・readonly・override のどれかが要ります',
    );
};

export class TSParameterPropertyTypeClass extends LwcCommonTypeClass<
    'tSParameterProperty',
    TSParameterPropertyFields
> {
    private constructor(value: FieldsOf<TSParameterPropertyFields>, sourceSpan: SourceSpan) {
        super('tSParameterProperty', value, sourceSpan);
    }

    static create(
        target: TSParameterProperty,
        originalSource: string,
    ): TSParameterPropertyTypeClass {
        return new TSParameterPropertyTypeClass(
            {
                ...createModifierFields(target, originalSource),
                parameter: visitNode(
                    target.parameter,
                    originalSource,
                    tSParameterPropertyParameterPairs(),
                    'TSParameterProperty.parameter',
                ),
                decorators:
                    target.decorators == null
                        ? null
                        : target.decorators.map((child) =>
                              DecoratorTypeClass.create(child, originalSource),
                          ),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getAccessibility(): TSParameterPropertyFields['accessibility'] {
        return this.getFields().accessibility;
    }

    getReadonly(): TSParameterPropertyFields['readonly'] {
        return this.getFields().readonly;
    }

    getParameter(): TSParameterPropertyFields['parameter'] {
        return this.getFields().parameter;
    }

    getOverride(): TSParameterPropertyFields['override'] {
        return this.getFields().override;
    }

    getDecorators(): TSParameterPropertyFields['decorators'] {
        return this.getFields().decorators;
    }
}

export const tSParameterPropertyTypePair: EvaluatePair<
    TSParameterProperty,
    TSParameterPropertyTypeClass
> = makeEvaluatePair(isTSParameterProperty, (target, originalSource) =>
    TSParameterPropertyTypeClass.create(target, originalSource),
);

export const isTSParameterPropertyType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is TSParameterPropertyTypeClass => target instanceof TSParameterPropertyTypeClass;
