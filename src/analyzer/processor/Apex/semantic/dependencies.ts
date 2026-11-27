import type { ApexNodeJson, ConvertKeys, TypeJson } from '../../../types';
import { walkJson } from '../../commons/node';
import type {
    DependencyKind,
    ReferenceResolution,
    ReferenceSite,
    UnitDefinition,
    UnitDependencies,
    UnitReference,
} from '../../dependency/types';
import type { ApexBodySemantics, ApexSemanticAnalysis } from './analyze';
import { type ApexModifierInfo, hasApexAnnotation, isApexAnnotationArgTrue } from './declaration';
import { type ApexExpressionRef, namePathOf } from './call';
import { apexDynamicQueriesOf } from './dynamicQuery';
import { apexMemberNamesOf } from './members';
import { apexNamedReferencesOf } from './namedReferences';
import { resolveApexStandardName } from './standardNames';
import type { ApexTypeRef } from './type';

// 解析の結果 (analyze.ts) から参照を集め、今の依存関係の形 (UnitDependencies) に変換する (docs/plan.md 10 章 P2)。
// - 参照ごとに、どう解決したか (resolution) を持つ。依存関係に変換するのは resolved・standard・byName だけで、
//   候補 (candidates) と分からないもの (unknown) は変換しない (候補だけの参照が確定した依存に見えないように)
// - 参照の種類・名前・via は、今の抽出 (dependency/apex.ts) と同じ語彙にする (今のグラフで引けるように)
// - 名前を文字列で渡すもの (Label・Page・Flow・カスタム設定・Type.forName など) は、まだ今の抽出が受け持つ
//   (docs/plan.md 10 章 P2 の「古い処理からの移行」)

/** 参照の解決の結果 (共通の語。dependency/types.ts の ReferenceResolution) */
export type ApexReferenceResolution = ReferenceResolution;

/** 参照 1 つ (今の参照の形に、詳しい解決の結果を足したもの) */
export type ApexSemanticReference = Omit<UnitReference, 'resolution'> & {
    resolution: ApexReferenceResolution;
};

export type ApexSemanticDependencies = {
    /** すべての参照 (変換しないものを含む) */
    references: ApexSemanticReference[];
    /** 今の依存関係の形 (resolved・standard・byName・candidates の参照と、定義。unknown は入れない) */
    dependencies: UnitDependencies;
};

const DML_KINDS: Readonly<Record<string, DependencyKind>> = {
    insert: 'inserts',
    update: 'updates',
    upsert: 'upserts',
    delete: 'deletes',
    undelete: 'undeletes',
    merge: 'merges',
};

/** SOQL・SOSL の句 → via */
const QUERY_VIA: Readonly<Record<string, string>> = {
    select: 'select',
    typeOf: 'select',
    where: 'where',
    having: 'having',
    groupBy: 'groupBy',
    orderBy: 'orderBy',
    with: 'with',
    returning: 'returning',
};

/** Flow.Interview.X の型は Flow X の参照 (new は namedReferences.ts) */
const FLOW_INTERVIEW = /^(?:System\.)?Flow\.Interview\.(\w+)$/i;

/** 依存関係に入れる確かさ (candidates はグラフの確定した辺にはしないが、使われているかの判定などに残す) */
const CONVERTED = new Set(['resolved', 'standard', 'byName', 'candidates']);

/** 単位をまたげば解決できるかもしれない、分からない理由 (ほかのクラスの名前・メンバー・メソッド・親クラス) */
const PENDING_REASONS = new Set([
    'unresolvedName',
    'externalMember',
    'externalMethod',
    'unknownReceiver',
    'memberNotFound',
    'methodNotFound',
    'noSuperclass',
]);

/** 解析の結果から参照を集め、今の依存関係の形に変換する */
export const apexSemanticDependenciesOf = (
    analysis: ApexSemanticAnalysis,
): ApexSemanticDependencies => {
    const {
        byId,
        ownerOf,
        qualifiedOf,
        memberOf,
        ownerTypeOf: ownerTypeOfDeclaration,
    } = apexMemberNamesOf(analysis.declarations, analysis.repository?.index);
    const typeDeclarations = analysis.declarations.filter(
        (d) => d.kind === 'class' || d.kind === 'interface' || d.kind === 'enum',
    );
    const references: ApexSemanticReference[] = [];
    const definitions: UnitDefinition[] = [];

    const add = (
        reference: Omit<UnitReference, 'from'>,
        from: ReferenceSite,
        resolution: ApexReferenceResolution,
    ) => references.push({ ...reference, from, resolution });

    const siteOf = (
        member: string | undefined,
        statement: ConvertKeys | undefined,
        expression: ConvertKeys | undefined,
    ): ReferenceSite => ({
        ...(member ? { member } : {}),
        ...(statement ? { statement } : {}),
        ...(expression ? { expression } : {}),
    });

    /** 型の名前 (書いたまま) を、単位の中の型・標準の型・SObject・名前だけ、のどれかにする */
    const resolutionOfTypeName = (name: readonly string[]): ApexReferenceResolution => {
        const wanted = name.map((n) => n.toLowerCase());
        const local = typeDeclarations.find((d) => {
            const qualified = [...d.path, d.name].map((n) => n.toLowerCase());
            return (
                qualified.length >= wanted.length &&
                wanted.every((n, i) => qualified[qualified.length - wanted.length + i] === n)
            );
        });
        if (local) return { status: 'resolved', declarationId: local.id };
        const standard = resolveApexStandardName(name);
        if (standard?.kind === 'type' && standard.members.length === 0) {
            return { status: 'standard', qualifiedName: standard.type.qualifiedName };
        }
        if (standard?.kind === 'sObject' && standard.members.length === 0) {
            return standard.listed ? { status: 'standard' } : { status: 'byName' };
        }
        return { status: 'byName' };
    };

    /** 型の中の名前の型 (List<Map<Id, Account>> なら Account。型引数・要素の型も) */
    const namedTypesOf = (type: TypeJson): string[][] => {
        switch (type.type) {
            case 'custom':
                return [[...type.customType], ...(type.generic ?? []).flatMap(namedTypesOf)];
            case 'array':
            case 'list':
            case 'set':
                return namedTypesOf(type.elementType);
            case 'map':
                return [...namedTypesOf(type.keyType), ...namedTypesOf(type.valueType)];
            default:
                return [];
        }
    };

    /** 宣言の型の参照 */
    const typeRefs = (
        type: TypeJson | 'void' | undefined,
        via: string,
        member: string | undefined,
        statement: ConvertKeys | undefined,
        kind: DependencyKind = 'uses',
    ) => {
        if (!type || type === 'void') return;
        for (const name of namedTypesOf(type)) {
            const target = name.join('.');
            const flow = target.match(FLOW_INTERVIEW);
            if (flow) {
                add(
                    { refType: 'flow', target: flow[1]!, kind: 'uses', via: 'Flow.Interview' },
                    siteOf(member, statement, type.sourceKeys),
                    { status: 'byName' },
                );
                continue;
            }
            add(
                { refType: 'apexType', target, kind, via },
                siteOf(member, statement, type.sourceKeys),
                resolutionOfTypeName(name),
            );
        }
    };

    // ---------------------------------------------------------------
    // 定義と、宣言の型
    // ---------------------------------------------------------------
    for (const declaration of analysis.declarations) {
        const owner = ownerOf(declaration);
        const member = memberOf(declaration);
        switch (declaration.kind) {
            case 'class':
            case 'interface':
            case 'enum':
                definitions.push({
                    defType: 'apexClass',
                    name: qualifiedOf(declaration),
                    sourceKeys: declaration.sourceKeys,
                });
                for (const type of declaration.extends)
                    typeRefs(type, 'extends', member, declaration.sourceKeys, 'extends');
                for (const type of declaration.implements)
                    typeRefs(type, 'implements', member, declaration.sourceKeys, 'implements');
                break;
            case 'trigger':
                definitions.push({ defType: 'apexTrigger', name: declaration.name });
                add(
                    {
                        refType: 'object',
                        target: declaration.object,
                        kind: 'triggers',
                        via: 'trigger.object',
                    },
                    siteOf(declaration.name, undefined, undefined),
                    resolutionOfTypeName([declaration.object]),
                );
                break;
            case 'method':
            case 'interfaceMethod':
                if (owner && member) {
                    const traits = apexMethodTraitsOf(declaration);
                    definitions.push({
                        defType: 'apexMethod',
                        name: member,
                        sourceKeys: declaration.sourceKeys,
                        ...(traits.length ? { traits } : {}),
                    });
                }
                typeRefs(declaration.returnType, 'returnType', member, declaration.sourceKeys);
                break;
            case 'property':
                if (owner && member) {
                    definitions.push({
                        defType: 'apexProperty',
                        name: member,
                        sourceKeys: declaration.sourceKeys,
                    });
                }
                typeRefs(declaration.type, 'property', member, declaration.sourceKeys);
                break;
            case 'field':
                if (owner) {
                    definitions.push({
                        defType: 'apexProperty',
                        name: `${qualifiedOf(owner)}.${declaration.name}`,
                        sourceKeys: declaration.statementSourceKeys,
                    });
                }
                typeRefs(declaration.type, 'field', member, declaration.statementSourceKeys);
                break;
            case 'parameter': {
                // 引数は、引数を持つメソッド・コンストラクターの場所の参照
                const method = owner;
                typeRefs(declaration.type, 'parameter', memberOf(method), method?.sourceKeys);
                break;
            }
            default:
                break;
        }
    }

    // ---------------------------------------------------------------
    // 実行本体の中の参照
    // ---------------------------------------------------------------

    /** 呼び出しの本体 */
    const bodyOfCall = new Map<string, ApexBodySemantics>();
    for (const body of analysis.bodies) {
        for (const call of body.calls) bodyOfCall.set(call.id, body);
    }
    const semanticsOf = (call: { id: string }) => bodyOfCall.get(call.id);

    /** 本体を所有する、いちばん内側の型 */
    const ownerTypeOf = (semantics: ApexBodySemantics | undefined) =>
        ownerTypeOfDeclaration(semantics ? byId.get(semantics.body.id) : undefined);
    for (const body of analysis.bodies) bodyRefs(body);

    function bodyRefs(semantics: ApexBodySemantics) {
        const member = memberOf(byId.get(semantics.body.id));
        const site = (keys: ConvertKeys) =>
            siteOf(member, semantics.statementOf[keys.sourceKey], keys);

        // 本体の中の変数の型 (ローカル変数・for-each・catch・when)
        for (const variable of semantics.variables) {
            if (variable.kind === 'parameter') continue;
            const via =
                variable.kind === 'catchVariable' ? 'catch' : variable.topLevel ? 'field' : 'type';
            typeRefs(
                variable.type,
                via,
                member,
                semantics.statementOf[variable.sourceKeys.sourceKey] ?? variable.sourceKeys,
            );
        }

        // 式の中の型 (キャスト (Account) x・x instanceof Account・Account.class)
        for (const statement of semantics.body.statements) {
            walkJson<ApexNodeJson>(statement as ApexNodeJson, {
                enter: {
                    cast: (node) =>
                        void typeRefs(
                            node.convertType,
                            'type',
                            member,
                            semantics.statementOf[node.sourceKeys.sourceKey],
                        ),
                    instanceof: (node) =>
                        void typeRefs(
                            node.checkType,
                            'type',
                            member,
                            semantics.statementOf[node.sourceKeys.sourceKey],
                        ),
                    classLiteral: (node) =>
                        void typeRefs(
                            node.classType,
                            'type',
                            member,
                            semantics.statementOf[node.sourceKeys.sourceKey],
                        ),
                },
            });
        }

        const named = apexNamedReferencesOf(semantics);
        for (const reference of named.references) {
            const { expression, resolution, ...rest } = reference;
            add(rest, site(expression), resolution);
        }

        for (const call of semantics.calls) {
            if (!named.handled.has(call.id)) callRefs(call, site);
        }
        for (const access of semantics.memberAccesses) {
            if (named.handled.has(access.sourceKeys.sourceKey)) continue;
            if (sObjectPathRefs(access, site(access.sourceKeys))) continue;
            memberRefs(
                access.object,
                access.objectType,
                access.member,
                access.access,
                site(access.sourceKeys),
            );
        }
        // 親クラスから引き継いだフィールド・プロパティ (修飾のない名前)。this.x と同じ語彙の参照にする
        for (const inherited of semantics.inheritedAccesses) {
            const declaration = byId.get(inherited.declarationId);
            const owner = declaration ? ownerOf(declaration) : undefined;
            if (!declaration || !owner) continue;
            const writes = inherited.access === 'write' || inherited.access === 'readWrite';
            add(
                {
                    refType: 'apexTypeMember',
                    target: `${qualifiedOf(owner)}.${declaration.name}`,
                    kind: writes ? 'writes' : 'reads',
                    via: writes ? 'assignment' : 'member',
                },
                site(inherited.sourceKeys),
                { status: 'resolved', declarationId: inherited.declarationId },
            );
        }
        for (const dml of semantics.dml) {
            const object = objectOfType(dml.valueType);
            add(
                {
                    refType: 'object',
                    target: object?.name ?? '',
                    kind: DML_KINDS[dml.operation]!,
                    via: `dml.${dml.operation}`,
                },
                site(dml.sourceKeys),
                object?.resolution ?? unknownOf(dml.valueType),
            );
        }
        for (const query of semantics.queries) queryRefs(query, semantics, site);
        // 動的 SOQL の復元 (dynamicQuery.ts)。確実な部分だけで、位置は元の呼び出し
        for (const query of apexDynamicQueriesOf(semantics)) {
            const from = site(query.sourceKeys);
            for (const object of query.objects) {
                add(
                    { refType: 'object', target: object, kind: 'queries', via: 'soql.dynamic' },
                    from,
                    resolutionOfTypeName([object]),
                );
                for (const field of query.fields) {
                    const path = field.split('.');
                    add(
                        path.length > 1
                            ? {
                                  refType: 'fieldPath',
                                  target: `${object}.${field}`,
                                  kind: 'reads',
                                  via: 'soql.dynamic',
                              }
                            : {
                                  refType: 'field',
                                  target: `${object}.${field}`,
                                  kind: 'reads',
                                  via: 'soql.dynamic',
                              },
                        from,
                        { status: 'byName' },
                    );
                }
            }
        }
    }

    /** 型から、オブジェクトの名前 (List・Set は要素、Map は値) */
    function objectOfType(
        type: ApexTypeRef,
    ): { name: string; resolution: ApexReferenceResolution } | undefined {
        if (type.kind === 'list' || type.kind === 'set') return objectOfType(type.element);
        if (type.kind === 'map') return objectOfType(type.value);
        if (type.kind !== 'named') return undefined;
        return { name: type.name.join('.'), resolution: resolutionOfTypeName(type.name) };
    }

    function unknownOf(type: ApexTypeRef): ApexReferenceResolution {
        return type.kind === 'unknown'
            ? {
                  status: 'unknown',
                  reason: type.reason,
                  ...(type.detail ? { detail: type.detail } : {}),
              }
            : { status: 'unknown', reason: 'notObject', detail: type.kind };
    }

    /** レシーバーの名前 (変数の型・静的な参照の名前の並び)。名前にできなければ undefined */
    function receiverNameOf(
        receiver: ApexExpressionRef,
        receiverType: ApexTypeRef | undefined,
    ): { name: string; resolution: ApexReferenceResolution } | undefined {
        if (!receiverType) return undefined;
        switch (receiverType.kind) {
            case 'static': {
                const path = namePathOf(receiver);
                const name = (path ?? receiverType.type.name).join('.');
                return {
                    name,
                    resolution: receiverType.type.declarationId
                        ? { status: 'resolved', declarationId: receiverType.type.declarationId }
                        : receiverType.type.standard?.kind === 'type'
                          ? {
                                status: 'standard',
                                qualifiedName: receiverType.type.standard.qualifiedName,
                            }
                          : { status: 'standard' },
                };
            }
            case 'named':
                return {
                    name: receiverType.name.join('.'),
                    resolution: receiverType.declarationId
                        ? { status: 'resolved', declarationId: receiverType.declarationId }
                        : receiverType.standard?.kind === 'type'
                          ? {
                                status: 'standard',
                                qualifiedName: receiverType.standard.qualifiedName,
                            }
                          : receiverType.standard
                            ? { status: 'standard' }
                            : { status: 'byName' },
                };
            case 'unknown': {
                // 名前の並びのまま分からない (ほかの単位の型 AccountService など)。小文字で始まる名前は変数とみなす
                if (receiverType.reason !== 'unresolvedName') return undefined;
                const path = namePathOf(receiver);
                if (!path || /^[a-z]/.test(path[0] ?? '')) return undefined;
                return { name: path.join('.'), resolution: { status: 'byName' } };
            }
            default:
                return undefined;
        }
    }

    function callRefs(
        call: ApexBodySemantics['calls'][number],
        site: (keys: ConvertKeys) => ReferenceSite,
    ) {
        const from = site(call.sourceKeys);
        if (call.kind === 'constructor') return;
        if (call.kind === 'new') {
            const created = call.type?.type === 'array' ? call.type.elementType : call.type;
            if (
                !created ||
                created.type === 'list' ||
                created.type === 'set' ||
                created.type === 'map'
            )
                return;
            const name =
                created.type === 'custom'
                    ? created.customType
                    : created.type === 'primitive'
                      ? [created.primitiveType]
                      : undefined;
            if (!name || FLOW_INTERVIEW.test(name.join('.'))) return;
            add(
                { refType: 'apexType', target: name.join('.'), kind: 'creates', via: 'new' },
                from,
                resolutionOfTypeName(name),
            );
            return;
        }

        // 実行時に呼ばれうるメソッド (インターフェース・親クラスの型の変数で呼んだとき、実装・継承しているクラスのもの)。
        // どれが呼ばれるかは決まらないので候補の参照にする (依存関係には入れない。docs/plan.md 2.2)
        for (const id of call.dispatchIds) {
            const method = byId.get(id);
            add(
                {
                    refType: 'apexMethod',
                    target: method ? (memberOf(method) ?? call.name) : call.name,
                    kind: 'calls',
                    via: 'dispatch',
                },
                from,
                { status: 'candidates', declarationIds: call.dispatchIds },
            );
        }

        // 単位の中のメソッド
        if (call.candidateIds.length === 1) {
            const method = byId.get(call.candidateIds[0]!);
            add(
                {
                    refType: 'apexMethod',
                    target: method ? (memberOf(method) ?? call.name) : call.name,
                    kind: 'calls',
                    via: 'call',
                },
                from,
                { status: 'resolved', declarationId: call.candidateIds[0]! },
            );
            return;
        }
        if (call.candidateIds.length > 1) {
            // 候補ごとに、完全な名前 (Outer.method) の候補の参照にする (グラフで引けるように)
            for (const id of call.candidateIds) {
                const method = byId.get(id);
                add(
                    {
                        refType: 'apexMethod',
                        target: method ? (memberOf(method) ?? call.name) : call.name,
                        kind: 'calls',
                        via: 'call',
                    },
                    from,
                    { status: 'candidates', declarationIds: call.candidateIds },
                );
            }
            return;
        }
        if (!call.receiver || call.receiver.kind === 'this' || call.receiver.kind === 'super') {
            // 単位の中にないメソッド (ほかの単位の親クラスのメソッドなど)。所有する型の名前で、名前だけの参照にする
            // (今の抽出と同じ名前。グラフで定義と突き合わせる)
            const ownerType = ownerTypeOf(semanticsOf(call));
            add(
                {
                    refType: 'apexMethod',
                    target: ownerType ? `${qualifiedOf(ownerType)}.${call.name}` : call.name,
                    kind: 'calls',
                    via: 'call',
                },
                from,
                ownerType && call.receiver?.kind !== 'super'
                    ? { status: 'byName' }
                    : unknownOf(call.returnType),
            );
            return;
        }
        // コレクションのメソッド (accounts.size()) は参照にしない
        const receiverType = call.receiverType;
        if (receiverType && ['list', 'set', 'map'].includes(receiverType.kind)) return;

        const receiver = receiverNameOf(call.receiver, receiverType);
        if (!receiver) {
            add(
                { refType: 'apexTypeMember', target: call.name, kind: 'calls', via: 'call' },
                from,
                receiverType
                    ? unknownOf(receiverType)
                    : { status: 'unknown', reason: 'noReceiver' },
            );
            return;
        }
        add(
            {
                refType: 'apexTypeMember',
                target: `${receiver.name}.${call.name}`,
                kind: 'calls',
                via: 'call',
            },
            from,
            receiver.resolution,
        );

        // Database.insert(records) などの DML のメソッドは、DML の文と同じ参照も出す
        const qualified =
            receiver.resolution.status === 'standard'
                ? receiver.resolution.qualifiedName
                : undefined;
        const operation = call.name.toLowerCase();
        if (qualified?.toLowerCase() === 'system.database' && DML_KINDS[operation]) {
            const argType = call.argTypes[0];
            const object = argType ? objectOfType(argType) : undefined;
            add(
                {
                    refType: 'object',
                    target: object?.name ?? '',
                    kind: DML_KINDS[operation]!,
                    via: `Database.${operation}`,
                },
                from,
                object?.resolution ??
                    (argType ? unknownOf(argType) : { status: 'unknown', reason: 'noArgument' }),
            );
        }
    }

    /** 型が SObject (標準オブジェクト・カスタムオブジェクト。リポジトリのクラスではない) なら、その名前 */
    function sObjectNameOf(type: ApexTypeRef): string | undefined {
        return type.kind === 'named' && !type.declarationId && type.standard?.kind === 'sObject'
            ? type.name.join('.')
            : undefined;
    }

    /**
     * SObject の関係をたどるメンバーの参照 (`a.Owner.Name`・`i.Account__r.Name`)。SOQL の関係のパスと同じく、
     * 途中の段 (`a.Owner`) は参照項目 (Account.OwnerId)、いちばん外の段は関係のパス全体 (fieldPath: Account.Owner.Name。
     * グラフがスキーマでたどる) の参照にする。参照にしたら true
     */
    function sObjectPathRefs(
        access: ApexBodySemantics['memberAccesses'][number],
        from: ReferenceSite,
    ): boolean {
        const kind: DependencyKind = access.access === 'read' ? 'reads' : 'writes';
        if (access.isReceiver) {
            const object = sObjectNameOf(access.objectType);
            if (!object) return false;
            add(
                {
                    refType: 'field',
                    target: `${object}.${lookupFieldOf(access.member)}`,
                    kind: 'reads',
                    via: 'member',
                },
                from,
                { status: 'byName' },
            );
            return true;
        }
        const root = access.chain?.find((prefix) => sObjectNameOf(prefix.rootType));
        const object = root && sObjectNameOf(root.rootType);
        if (!root || !object) return false;
        add(
            {
                refType: 'fieldPath',
                target: `${object}.${root.members.join('.')}`,
                kind,
                via: access.access === 'read' ? 'member' : 'assignment',
            },
            from,
            { status: 'byName' },
        );
        return true;
    }

    function memberRefs(
        object: ApexExpressionRef,
        objectType: ApexTypeRef,
        member: string,
        access: 'read' | 'write' | 'readWrite',
        from: ReferenceSite,
    ) {
        const kind: DependencyKind = access === 'read' ? 'reads' : 'writes';
        const via = access === 'read' ? 'member' : 'assignment';
        // 標準の型の静的なメンバー (Trigger.new など) は参照にしない (Label.X・Schema は namedReferences.ts)
        if (objectType.kind === 'static' && objectType.type.standard) return;
        if (objectType.kind === 'list' || objectType.kind === 'set' || objectType.kind === 'map')
            return;
        const receiver = receiverNameOf(object, objectType);
        if (!receiver) {
            add(
                { refType: 'apexTypeMember', target: member, kind, via },
                from,
                unknownOf(objectType),
            );
            return;
        }
        add(
            { refType: 'apexTypeMember', target: `${receiver.name}.${member}`, kind, via },
            from,
            receiver.resolution,
        );
    }

    function queryRefs(
        query: ApexBodySemantics['queries'][number],
        semantics: ApexBodySemantics,
        site: (keys: ConvertKeys) => ReferenceSite,
    ) {
        const prefix = query.kind;
        const parent = query.parentId
            ? semantics.queries.find((q) => q.id === query.parentId)
            : undefined;
        const parentObject = parent?.objects[0]?.name;
        // クエリの中の参照の位置は、いちばん外のクエリ (今の抽出と同じ。report の apex.dataAccess がクエリごとにまとめる)
        let root = query;
        for (let up = parent; up;) {
            root = up;
            up = up.parentId ? semantics.queries.find((q) => q.id === up!.parentId) : undefined;
        }
        const queryFrom = site(root.sourceKeys);

        if (query.role === 'childRelationship' && parentObject) {
            const relationship = query.objects[0]?.name ?? '';
            const target = `${parentObject}.${relationship}`;
            add(
                { refType: 'childRelationship', target, kind: 'queries', via: 'soql.subquery' },
                queryFrom,
                { status: 'byName' },
            );
            for (const field of query.fields) {
                const name = fieldNameOf(field.path);
                add(
                    {
                        refType: 'childRelationshipField',
                        target: `${target}.${name ?? field.path.join('.')}`,
                        kind: 'reads',
                        via: 'soql.subquery',
                    },
                    queryFrom,
                    name === undefined
                        ? {
                              status: 'unknown',
                              reason: 'relationshipPath',
                              detail: field.path.join('.'),
                          }
                        : { status: 'byName' },
                );
            }
            return;
        }

        for (const object of query.objects) {
            add(
                {
                    refType: 'object',
                    target: object.name,
                    kind: 'queries',
                    via: prefix === 'sosl' ? 'sosl.returning' : 'soql.from',
                },
                queryFrom,
                resolutionOfTypeName(object.name.split('.')),
            );
        }
        const mainObject = query.objects[0]?.name;
        for (const field of query.fields) {
            const via = `${prefix}.${QUERY_VIA[field.via] ?? field.via}`;
            // TYPEOF の多態の関係 (Event.What) そのものは項目ではない (WhatId の関係)
            const polymorphic = field.via === 'typeOf' && field.object === mainObject;
            if (polymorphic) {
                add(
                    {
                        refType: 'field',
                        target: `${field.object}.${field.path.join('.')}`,
                        kind: 'reads',
                        via,
                    },
                    queryFrom,
                    { status: 'unknown', reason: 'relationshipPath', detail: field.path.join('.') },
                );
                continue;
            }
            // 関係のパス (Account.Owner.Name・Account__r.Name) は、1 段目の参照項目 (AccountId・Account__c) と、
            // パス全体 (グラフがスキーマでたどる) の 2 つの参照にする
            const name = field.path.length > 1 ? lookupFieldOf(field.path[0]!) : field.path[0];
            if (name !== undefined)
                add(
                    { refType: 'field', target: `${field.object}.${name}`, kind: 'reads', via },
                    queryFrom,
                    { status: 'byName' },
                );
            if (field.path.length > 1)
                add(
                    {
                        refType: 'fieldPath',
                        target: `${field.object}.${field.path.join('.')}`,
                        kind: 'reads',
                        via,
                    },
                    queryFrom,
                    { status: 'byName' },
                );
        }
    }

    /**
     * 関係の名前から、その参照項目の名前。カスタムの関係 (Account__r) は Account__c、標準の関係 (Owner・Account) は
     * 名前 + Id (OwnerId・AccountId。標準の参照項目の決まり)
     */
    function lookupFieldOf(relationship: string): string {
        return /__r$/i.test(relationship)
            ? relationship.replace(/__r$/i, '__c')
            : `${relationship}Id`;
    }

    /**
     * 項目の名前の並びから、参照する項目の名前。カスタムの関係 (Account__r.Name) は参照項目 (Account__c)。
     * 標準の関係 (Owner.Name) の先はスキーマを引く参照の解決で決めるので undefined
     */
    function fieldNameOf(path: readonly string[]): string | undefined {
        const [first, ...rest] = path;
        if (!first) return undefined;
        if (rest.length === 0) return first;
        return /__r$/i.test(first) ? first.replace(/__r$/i, '__c') : undefined;
    }

    // 単位をまたげば解決できるかもしれない参照 (リポジトリの索引を渡して解析したときは数えない)。
    // 単位の中にない親クラス・単位の中にないメソッドの呼び出しと、ほかの単位の型のメンバー・メソッド (名前だけの参照。
    // 戻り値の型・インターフェースの実装クラスへの呼び出しは、単位をまたいで解決して分かる) も数える
    const pendingResolution = analysis.repository
        ? 0
        : references.filter(
              (r) =>
                  (r.resolution.status === 'unknown' && PENDING_REASONS.has(r.resolution.reason)) ||
                  ((r.refType === 'apexMethod' || r.refType === 'apexTypeMember') &&
                      r.resolution.status === 'byName'),
          ).length +
          typeDeclarations.filter(
              (d) =>
                  d.kind === 'class' &&
                  d.extends.length > 0 &&
                  resolutionOfTypeName(namedTypesOf(d.extends[0]!)[0] ?? []).status === 'byName',
          ).length;

    return {
        references,
        dependencies: {
            ...(pendingResolution > 0 ? { pendingResolution } : {}),
            definitions,
            references: dedupe(
                references
                    .filter((r) => CONVERTED.has(r.resolution.status) && r.target !== '')
                    .map(({ resolution, ...reference }): UnitReference => ({
                        ...reference,
                        ...(resolution.status === 'byName' ||
                        resolution.status === 'unknown' ||
                        resolution.status === 'missing'
                            ? {}
                            : { resolution: resolution.status }),
                    })),
            ),
        },
    };
};

/** 同じ場所の同じ参照は 1 つにする (今の抽出と同じ決まり) */
const dedupe = (references: UnitReference[]): UnitReference[] => {
    const seen = new Set<string>();
    return references.filter((reference) => {
        const key = JSON.stringify([
            reference.refType,
            reference.target,
            reference.kind,
            reference.via,
            reference.from.member,
            reference.from.statement?.sourceKey,
            reference.from.expression?.sourceKey,
        ]);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
};

/** Apex のメソッドの定義の性質 (UnitDefinition.traits。LWC から使えるか) */
const apexMethodTraitsOf = (declaration: { modifiers?: ApexModifierInfo }): string[] => {
    const modifiers = declaration.modifiers;
    if (!modifiers || !hasApexAnnotation(modifiers, 'AuraEnabled')) return [];
    return isApexAnnotationArgTrue(modifiers, 'AuraEnabled', 'cacheable')
        ? ['auraEnabled', 'cacheable']
        : ['auraEnabled'];
};
