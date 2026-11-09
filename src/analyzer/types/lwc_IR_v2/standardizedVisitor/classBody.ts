import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isClassBody, type ClassBody } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNodeList,
    getSourceSpan,
} from '../commonVisitor';
import {
    classAccessorPropertyTypePair,
    type ClassAccessorPropertyTypeClass,
} from '../commons/classAccessorProperty';
import { classMethodTypePair, type ClassMethodTypeClass } from '../commons/classMethod';
import {
    classPrivateMethodTypePair,
    type ClassPrivateMethodTypeClass,
} from '../commons/classPrivateMethod';
import {
    classPrivatePropertyTypePair,
    type ClassPrivatePropertyTypeClass,
} from '../commons/classPrivateProperty';
import { classPropertyTypePair, type ClassPropertyTypeClass } from '../commons/classProperty';
import { staticBlockTypePair, type StaticBlockTypeClass } from '../commons/staticBlock';
import {
    tSIndexSignatureTypePair,
    type TSIndexSignatureTypeClass,
} from '../commons/tSIndexSignature';
import {
    tSDeclareMethodTypePair,
    type TSDeclareMethodTypeClass,
} from '../typeScriptVisitor/tSDeclareMethod';

const classBodyBodyPairs = lazyPairs(
    () =>
        [
            classMethodTypePair,
            classPrivateMethodTypePair,
            classPropertyTypePair,
            classPrivatePropertyTypePair,
            classAccessorPropertyTypePair,
            tSDeclareMethodTypePair,
            tSIndexSignatureTypePair,
            staticBlockTypePair,
        ] as const,
);

export type ClassBodyFields = TypeField<'classBody'> & {
    body: (
        | ClassMethodTypeClass
        | ClassPrivateMethodTypeClass
        | ClassPropertyTypeClass
        | ClassPrivatePropertyTypeClass
        | ClassAccessorPropertyTypeClass
        | TSDeclareMethodTypeClass
        | TSIndexSignatureTypeClass
        | StaticBlockTypeClass
    )[];
};

export class ClassBodyTypeClass extends LwcCommonTypeClass<'classBody', ClassBodyFields> {
    private constructor(value: FieldsOf<ClassBodyFields>, sourceSpan: SourceSpan) {
        super('classBody', value, sourceSpan);
    }

    static create(target: ClassBody, originalSource: string): ClassBodyTypeClass {
        return new ClassBodyTypeClass(
            {
                body: visitNodeList(
                    target.body,
                    originalSource,
                    classBodyBodyPairs(),
                    'ClassBody.body',
                ),
            },
            getSourceSpan(target, originalSource),
        );
    }

    getBody(): ClassBodyFields['body'] {
        return this.getFields().body;
    }
}

export const classBodyTypePair: EvaluatePair<ClassBody, ClassBodyTypeClass> = makeEvaluatePair(
    isClassBody,
    (target, originalSource) => ClassBodyTypeClass.create(target, originalSource),
);

export const isClassBodyType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is ClassBodyTypeClass => target instanceof ClassBodyTypeClass;
