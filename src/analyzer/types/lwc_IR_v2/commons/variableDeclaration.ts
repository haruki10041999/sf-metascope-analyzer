import { type FieldsOf, type TypeField } from '../../commons/ir';
import { type SourceSpan } from '../../commons/source';
import { isVariableDeclaration, type VariableDeclaration } from '@babel/types';
import { failIrBuild, toNonEmptyArray, type NonEmptyArray } from '../buildFailure';
import {
    EvaluatePair,
    LwcCommonTypeClass,
    makeEvaluatePair,
    getSourceSpan,
} from '../commonVisitor';
import {
    VariableDeclaratorTypeClass,
    type ConstVariableDeclaratorFields,
    type ForHeadIdentifierVariableDeclaratorFields,
    type ForHeadVariableDeclaratorFields,
    type InitializedIdentifierVariableDeclaratorFields,
    type UninitializedVariableDeclaratorFields,
} from '../standardizedVisitor/variableDeclarator';

/**
 * 宣言の種類 (kind) と declare ごとに、declarator に書けるものが決まる。
 * - var・let: どれでも (init は省略できる)
 * - const: init が要る (ambient の文脈の `const x: T;` だけは init なし)
 * - using・await using: 識別子と init が要る
 * - declare 付き: var・let は init なし。const は const と同じ。using は書けない
 * for-in・for-of の左辺の宣言は、ForHeadDeclarationTypeClass で表す
 */
type VariableDeclarationKindFields =
    | {
          declare: false;
          kind: 'var' | 'let';
          declarations: NonEmptyArray<VariableDeclaratorTypeClass>;
      }
    | {
          declare: boolean;
          kind: 'const';
          declarations: NonEmptyArray<VariableDeclaratorTypeClass<ConstVariableDeclaratorFields>>;
      }
    | {
          declare: false;
          kind: 'using' | 'await using';
          declarations: NonEmptyArray<
              VariableDeclaratorTypeClass<InitializedIdentifierVariableDeclaratorFields>
          >;
      }
    | {
          declare: true;
          kind: 'var' | 'let';
          declarations: NonEmptyArray<
              VariableDeclaratorTypeClass<UninitializedVariableDeclaratorFields>
          >;
      };

export type VariableDeclarationFields = TypeField<'variableDeclaration'> &
    VariableDeclarationKindFields;

const createKindFields = (
    target: VariableDeclaration,
    originalSource: string,
): VariableDeclarationKindFields => {
    const declare = target.declare ?? false;
    const declarations = <T>(
        create: (child: VariableDeclaration['declarations'][number], source: string) => T,
    ): NonEmptyArray<T> =>
        toNonEmptyArray(
            target.declarations.map((child) => create(child, originalSource)),
            target,
            originalSource,
            '変数の宣言には declarator が 1 個以上要ります',
        );

    switch (target.kind) {
        case 'var':
        case 'let':
            return declare
                ? {
                      declare: true,
                      kind: target.kind,
                      declarations: declarations(VariableDeclaratorTypeClass.createUninitialized),
                  }
                : {
                      declare: false,
                      kind: target.kind,
                      declarations: declarations(VariableDeclaratorTypeClass.create),
                  };
        case 'const':
            return {
                declare,
                kind: 'const',
                declarations: declarations(VariableDeclaratorTypeClass.createConst),
            };
        case 'using':
        case 'await using':
            return declare
                ? failIrBuild(
                      'TYPE_MISMATCH',
                      target,
                      originalSource,
                      `${target.kind} の宣言に declare は付けられません`,
                  )
                : {
                      declare: false,
                      kind: target.kind,
                      declarations: declarations(
                          VariableDeclaratorTypeClass.createInitializedIdentifier,
                      ),
                  };
    }
};

export class VariableDeclarationTypeClass extends LwcCommonTypeClass<
    'variableDeclaration',
    VariableDeclarationFields
> {
    private constructor(value: FieldsOf<VariableDeclarationFields>, sourceSpan: SourceSpan) {
        super('variableDeclaration', value, sourceSpan);
    }

    static create(
        target: VariableDeclaration,
        originalSource: string,
    ): VariableDeclarationTypeClass {
        return new VariableDeclarationTypeClass(
            createKindFields(target, originalSource),
            getSourceSpan(target, originalSource),
        );
    }

    getDeclare(): VariableDeclarationFields['declare'] {
        return this.getFields().declare;
    }

    getKind(): VariableDeclarationFields['kind'] {
        return this.getFields().kind;
    }

    getDeclarations(): VariableDeclarationFields['declarations'] {
        return this.getFields().declarations;
    }
}

export const variableDeclarationTypePair: EvaluatePair<
    VariableDeclaration,
    VariableDeclarationTypeClass
> = makeEvaluatePair(isVariableDeclaration, (target, originalSource) =>
    VariableDeclarationTypeClass.create(target, originalSource),
);

export const isVariableDeclarationType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is VariableDeclarationTypeClass => target instanceof VariableDeclarationTypeClass;

// ---------------------------------------------------------------------------
// for-in・for-of の左辺の宣言 (`for (const x of y)`)
// ---------------------------------------------------------------------------

/** for-in に書ける宣言の種類 (using は書けない) */
export type ForInHeadKind = 'var' | 'let' | 'const';

type ForHeadDeclarationKindFields<TKind extends VariableDeclaration['kind']> = TKind extends
    'using' | 'await using'
    ? {
          kind: TKind;
          declarator: VariableDeclaratorTypeClass<ForHeadIdentifierVariableDeclaratorFields>;
      }
    : {
          kind: TKind;
          declarator: VariableDeclaratorTypeClass<ForHeadVariableDeclaratorFields>;
      };

/**
 * for-in・for-of の左辺の宣言。declarator はちょうど 1 個で、init がない。
 * using・await using の id は識別子だけ
 */
export type ForHeadDeclarationFields<
    TKind extends VariableDeclaration['kind'] = VariableDeclaration['kind'],
> = TypeField<'forHeadDeclaration'> & ForHeadDeclarationKindFields<TKind>;

export class ForHeadDeclarationTypeClass<
    TKind extends VariableDeclaration['kind'] = VariableDeclaration['kind'],
> extends LwcCommonTypeClass<'forHeadDeclaration', ForHeadDeclarationFields<TKind>> {
    private constructor(value: FieldsOf<ForHeadDeclarationFields<TKind>>, sourceSpan: SourceSpan) {
        super('forHeadDeclaration', value, sourceSpan);
    }

    private static createKindFields(
        target: VariableDeclaration,
        originalSource: string,
    ): ForHeadDeclarationKindFields<VariableDeclaration['kind']> {
        const [declarator, ...rest] = target.declarations;
        if (declarator == null || rest.length > 0 || target.declare) {
            return failIrBuild(
                'TYPE_MISMATCH',
                target,
                originalSource,
                'for-in・for-of の左辺の宣言は、declare のない declarator 1 個だけです',
            );
        }
        switch (target.kind) {
            case 'using':
            case 'await using':
                return {
                    kind: target.kind,
                    declarator: VariableDeclaratorTypeClass.createForHeadIdentifier(
                        declarator,
                        originalSource,
                    ),
                };
            default:
                return {
                    kind: target.kind,
                    declarator: VariableDeclaratorTypeClass.createForHead(
                        declarator,
                        originalSource,
                    ),
                };
        }
    }

    /** for-of の左辺 */
    static create(
        target: VariableDeclaration,
        originalSource: string,
    ): ForHeadDeclarationTypeClass {
        return new ForHeadDeclarationTypeClass(
            ForHeadDeclarationTypeClass.createKindFields(target, originalSource),
            getSourceSpan(target, originalSource),
        );
    }

    /** for-in の左辺 (using は書けない) */
    static createForIn(
        target: VariableDeclaration,
        originalSource: string,
    ): ForHeadDeclarationTypeClass<ForInHeadKind> {
        const fields = ForHeadDeclarationTypeClass.createKindFields(target, originalSource);
        if (fields.kind === 'using' || fields.kind === 'await using') {
            return failIrBuild(
                'TYPE_MISMATCH',
                target,
                originalSource,
                'for-in の左辺に using は書けません',
            );
        }
        return new ForHeadDeclarationTypeClass<ForInHeadKind>(
            fields,
            getSourceSpan(target, originalSource),
        );
    }

    getKind(): ForHeadDeclarationFields<TKind>['kind'] {
        return this.getFields().kind;
    }

    getDeclarator(): ForHeadDeclarationFields<TKind>['declarator'] {
        return this.getFields().declarator;
    }
}

export const isForHeadDeclarationType = (
    target: LwcCommonTypeClass<string, TypeField<string>>,
): target is ForHeadDeclarationTypeClass => target instanceof ForHeadDeclarationTypeClass;
