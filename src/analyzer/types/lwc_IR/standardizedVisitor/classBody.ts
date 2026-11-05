import { isClassBody, type ClassBody } from '@babel/types';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    LwcErrorTypeClass,
    lazyPairs,
    makeEvaluatePair,
    visitNodeList,
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

export type ClassBodyFields = {
    body: (
        | ClassMethodTypeClass
        | ClassPrivateMethodTypeClass
        | ClassPropertyTypeClass
        | ClassPrivatePropertyTypeClass
        | ClassAccessorPropertyTypeClass
        | TSDeclareMethodTypeClass
        | TSIndexSignatureTypeClass
        | StaticBlockTypeClass
        | LwcErrorTypeClass
    )[];
};

export class ClassBodyTypeClass extends LwcCommonTypeClass<'classBody'> {
    private readonly value: ClassBodyFields;

    private constructor(value: ClassBodyFields) {
        super('classBody');
        this.value = value;
    }

    static create(target: ClassBody, originalSource: string): ClassBodyTypeClass {
        return new ClassBodyTypeClass({
            body: visitNodeList(
                target.body,
                originalSource,
                classBodyBodyPairs(),
                'ClassBody.body',
            ),
        });
    }

    /** すべてのフィールド (Babel の value フィールドの getter getValue() と区別する。getChildNodes もこれから作る) */
    override getFields(): ClassBodyFields {
        return this.value;
    }

    getBody(): ClassBodyFields['body'] {
        return this.value.body;
    }
}

export const classBodyTypePair: EvaluatePair<ClassBody, ClassBodyTypeClass> = makeEvaluatePair(
    isClassBody,
    (target, originalSource) => ClassBodyTypeClass.create(target, originalSource),
);

export const isClassBodyType = (target: LwcCommonTypeClass<string>): target is ClassBodyTypeClass =>
    target instanceof ClassBodyTypeClass;
