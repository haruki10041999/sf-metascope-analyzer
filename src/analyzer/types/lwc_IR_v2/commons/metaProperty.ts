import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isMetaProperty, type MetaProperty } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    getSourceSpan,
} from '../commonVisitor';
import { failIrBuild } from '../buildFailure';

/** 書けるのは `new.target` と `import.meta` だけ */
export type MetaPropertyFields = TypeField<'metaProperty'> & {
    kind: 'new.target' | 'import.meta';
};

export class MetaPropertyTypeClass extends LwcCommonTypeClass<'metaProperty', MetaPropertyFields> {
    private constructor(value: FieldsOf<MetaPropertyFields>, sourceSpan: SourceSpan) {
        super('metaProperty', value, sourceSpan);
    }

    static create(target: MetaProperty, originalSource: string): MetaPropertyTypeClass {
        const kind = `${target.meta.name}.${target.property.name}`;
        return new MetaPropertyTypeClass(
            {
                kind:
                    kind === 'new.target' || kind === 'import.meta'
                        ? kind
                        : failIrBuild(
                              'TYPE_MISMATCH',
                              target,
                              originalSource,
                              `${kind} は MetaProperty ではありません`,
                          ),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getKind(): MetaPropertyFields['kind'] {
        return this.getFields().kind;
    }
}

export const metaPropertyTypePair: EvaluatePair<MetaProperty, MetaPropertyTypeClass> =
    makeEvaluatePair(isMetaProperty, (target, originalSource) =>
        MetaPropertyTypeClass.create(target, originalSource),
    );

export const isMetaPropertyType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is MetaPropertyTypeClass => target instanceof MetaPropertyTypeClass;
