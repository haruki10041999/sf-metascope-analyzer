import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isObjectProperty, type ObjectProperty } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNode,
    getSourceSpan,
} from '../commonVisitor';
import { expressionVisitorEvaluatePairs, type ExpressionTypeClass } from '../expressionVisitor';
import { patternLikeVisitorEvaluatePairs, type PatternLikeTypeClass } from '../patternLikeVisitor';
import { assignmentPatternTypePair, type AssignmentPatternTypeClass } from './assignmentPattern';
import { identifierTypePair, type IdentifierTypeClass } from './identifier';
import {
    createMemberKey,
    failUnsupported,
    staticMemberKeyOrPrivateNamePairs,
    type MemberKey,
    type StaticMemberKeyTypeClass,
} from './memberKey';
import { type PrivateNameTypeClass } from './privateName';

const objectPropertyValuePairs = lazyPairs(
    () => [...expressionVisitorEvaluatePairs(), ...patternLikeVisitorEvaluatePairs()] as const,
);
const objectPropertyShorthandKeyPairs = lazyPairs(() => [identifierTypePair] as const);
const objectPropertyShorthandValuePairs = lazyPairs(
    () => [identifierTypePair, assignmentPatternTypePair] as const,
);

/**
 * Babel 8 の ObjectPropertyComputed | ObjectPropertyNonComputed に、shorthand の決まりを足したもの。
 * - shorthand: false: key は computed で見分ける (computed: false の key に PrivateName も入るのは Babel 8 の型のとおり)
 * - shorthand: true (`{ a }`・分割代入の `{ a = 1 }`): computed ではなく、key は Identifier、value は同じ名前の
 *   Identifier か、それを左辺に持つ AssignmentPattern
 * オブジェクトリテラルでは書けないので decorators は持たない。
 * ObjectExpression と ObjectPattern で同じ型を使う (どちらの文脈かは親のノードで分かる)
 */
export type ObjectPropertyFields = TypeField<'objectProperty'> &
    (
        | (MemberKey<StaticMemberKeyTypeClass | PrivateNameTypeClass> & {
              shorthand: false;
              value: ExpressionTypeClass | PatternLikeTypeClass;
          })
        | {
              shorthand: true;
              computed: false;
              key: IdentifierTypeClass;
              value: IdentifierTypeClass | AssignmentPatternTypeClass;
          }
    );

export class ObjectPropertyTypeClass extends LwcCommonTypeClass<
    'objectProperty',
    ObjectPropertyFields
> {
    private constructor(value: FieldsOf<ObjectPropertyFields>, sourceSpan: SourceSpan) {
        super('objectProperty', value, sourceSpan);
    }

    static create(target: ObjectProperty, originalSource: string): ObjectPropertyTypeClass {
        const span = getSourceSpan(target, originalSource);
        if (target.shorthand) {
            if (target.computed) {
                return failUnsupported(
                    target,
                    originalSource,
                    'ObjectProperty: shorthand は computed にできません',
                );
            }
            return new ObjectPropertyTypeClass(
                {
                    shorthand: true,
                    computed: false,
                    key: visitNode(
                        target.key,
                        originalSource,
                        objectPropertyShorthandKeyPairs(),
                        'ObjectProperty.key',
                    ),
                    value: visitNode(
                        target.value,
                        originalSource,
                        objectPropertyShorthandValuePairs(),
                        'ObjectProperty.value',
                    ),
                },
                span,
            );
        }
        return new ObjectPropertyTypeClass(
            {
                ...createMemberKey(
                    target,
                    originalSource,
                    staticMemberKeyOrPrivateNamePairs(),
                    'ObjectProperty',
                ),
                shorthand: false,
                value: visitNode(
                    target.value,
                    originalSource,
                    objectPropertyValuePairs(),
                    'ObjectProperty.value',
                ),
            },
            span,
        );
    }

    getComputed(): ObjectPropertyFields['computed'] {
        return this.getFields().computed;
    }

    getKey(): ObjectPropertyFields['key'] {
        return this.getFields().key;
    }

    getValue(): ObjectPropertyFields['value'] {
        return this.getFields().value;
    }

    getShorthand(): ObjectPropertyFields['shorthand'] {
        return this.getFields().shorthand;
    }
}

export const objectPropertyTypePair: EvaluatePair<ObjectProperty, ObjectPropertyTypeClass> =
    makeEvaluatePair(isObjectProperty, (target, originalSource) =>
        ObjectPropertyTypeClass.create(target, originalSource),
    );

export const isObjectPropertyType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is ObjectPropertyTypeClass => target instanceof ObjectPropertyTypeClass;
