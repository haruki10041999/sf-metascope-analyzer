import type { ConvertKeys } from '../../types';
import { resolveApexStandardName } from '../Apex/semantic/standardNames';
import { findStandardObject } from '../commons/standardObjects';
import { METADATA_TYPE_NAMES } from '../Metadata/standardTypes';

import type {
    ChildRelationship,
    DependencyKind,
    UnitDefinition,
    UnitDependencies,
    ReferenceCertainty,
    UnitReference,
} from './types';

// 依存関係のグラフ。単位ごとの定義・参照 (units.ts) を集めて作る (保存しない)。方針: docs/analysis-plan.md 3 章
//
// ノードは 3 段: 単位 (AccountService / Invoice__c / 権限セット) → メンバー (メソッド・項目など) → 文・式。
// 辺は参照の場所のいちばん細かいノード (式、なければ文、なければメンバー・単位) から、参照先のノードへ張る。
// 参照先は、定義 (リポジトリにあるもの) と名前で突き合わせ、なければ標準 (standard)・パッケージ (managed)・
// ない (missing)・確かめられない (unknown) のどれかにする。

export type NodeOrigin = 'repository' | 'standard' | 'managed' | 'missing' | 'unknown';

/** ノードの細かさ */
export type NodeLevel = 'unit' | 'member' | 'site';

export type DependencyNode = {
    /** '<種類>:<名前>' (field:Invoice__c.Amount__c)。文・式は 'site:<単位のノード>:<sourceKey>' */
    id: string;
    type: string;
    name: string;
    level: NodeLevel;
    origin: NodeOrigin;
    /** ひとつ上のノード (メンバー → 単位、文・式 → メンバーか単位、式 → 文) */
    parent?: string;
    /** 定義している単位 (単位の種類と id)。リポジトリにあるときだけ */
    unit?: { type: string; id: string };
    sourceKeys?: ConvertKeys;
    /** 定義の性質 (UnitDefinition.traits。同じ名前の定義が複数あれば合わせたもの) */
    traits?: string[];
};

export type DependencyEdge = {
    from: string;
    to: string;
    kind: DependencyKind;
    via: string;
    /** 参照している単位 */
    unit: { type: string; id: string };
    /**
     * 確かさ (リポジトリの定義と突き合わせたあと)。参照先がリポジトリにあれば resolved、リポジトリにも標準にもなければ
     * missing、標準なら standard。それ以外 (managed・unknown) は単位の参照の確かさのまま (持たなければ byName)
     */
    resolution?: Exclude<ReferenceCertainty, 'candidates'>;
};

export type DependencyFinding = {
    code: string;
    severity: 'warning' | 'info';
    /** 参照先 (field:Invoice__c.Missing__c) */
    target: string;
    /** 参照しているノード (いちばん細かいもの) */
    from: string;
    message: string;
};

export type DependencyGraph = {
    nodes: Map<string, DependencyNode>;
    edges: DependencyEdge[];
    findings: DependencyFinding[];
    /**
     * 候補の参照 (resolution: candidates。オーバーロード・インターフェースの実装クラスなど) の辺。
     * 確定した依存ではないので edges・被依存・指摘には入れない。使われているかの判定などで「使われうる」に使う。
     * 参照先がグラフにあるものだけ (メンバーの細かさ)
     */
    candidateEdges: DependencyEdge[];
};

/** 単位 1 つの入力 */
export type GraphUnit = { type: string; id: string; dependencies: UnitDependencies };

// ---------------------------------------------------------------------------
// 名前の突き合わせ
// ---------------------------------------------------------------------------

/**
 * オブジェクトとして扱う標準の名前 (リポジトリになくても「ない」とは言わない。Apex の型がオブジェクトかの判断にも使う)。
 * 一覧は Apex の解析と共通 (processor/commons/standardObjects.ts)。SObject は汎用の型だが、オブジェクトとして扱う
 */
const isStandardObjectName = (name: string): boolean =>
    name.toLowerCase() === 'sobject' || findStandardObject(name) !== undefined;

const CUSTOM_SUFFIX = /__(c|mdt|e|x|b|share|history|feed|r)$/i;
/**
 * 名前空間付きの名前。ns__Name__c (接尾辞あり) と、接尾辞のない種類の ns__Name (メッセージチャネル・クラスなど)。
 * Name__c (接尾辞だけ) は名前空間なし
 */
const isNamespaced = (name: string) =>
    /^[A-Za-z][A-Za-z0-9]*__[A-Za-z]/.test(name) &&
    (/__.*__/.test(name) || !CUSTOM_SUFFIX.test(name));
const isCustom = (name: string) => CUSTOM_SUFFIX.test(name);

/**
 * どのオブジェクトにもある (カスタムオブジェクトにもある) 標準の項目。一覧にない標準の項目は、オブジェクトが標準の一覧に
 * あれば standard、なければ unknown (確かめていない名前を standard にしない。docs/plan.md 10 章 P2)
 */
const COMMON_STANDARD_FIELDS = new Set(
    [
        'Id',
        'Name',
        'OwnerId',
        'RecordTypeId',
        'CurrencyIsoCode',
        'CreatedDate',
        'CreatedById',
        'LastModifiedDate',
        'LastModifiedById',
        'SystemModstamp',
        'IsDeleted',
        'LastActivityDate',
        'LastViewedDate',
        'LastReferencedDate',
        // カスタムメタデータ型
        'DeveloperName',
        'MasterLabel',
        'Label',
        'QualifiedApiName',
        'NamespacePrefix',
        'Language',
    ].map((name) => name.toLowerCase()),
);

/**
 * 標準の関係のうち、名前と参照先のオブジェクトが違うもの (SOQL の関係のパスをたどるのに使う)。
 * Owner は User か Group (キュー) だが、項目の参照としては User にする。What・Who などの多態は入れない (そこで止める)
 */
const STANDARD_RELATIONSHIP_TARGETS: Readonly<Record<string, string>> = {
    owner: 'User',
    createdby: 'User',
    lastmodifiedby: 'User',
    manager: 'User',
    delegatedapprover: 'User',
    recordtype: 'RecordType',
};

/** Apex の標準の型 (名前空間・型の一覧にある。System を省いたものも) か */
const isApexStandardTypeName = (name: string): boolean => {
    // AggregateResult は集計の SOQL の結果の型 (Apex の資料の SObject の章。型の一覧・オブジェクトの一覧のどちらにもない)
    if (/^(schema\.)?aggregateresult$/i.test(name)) return true;
    const resolved = resolveApexStandardName(name.split('.'));
    return resolved !== undefined && resolved.kind !== 'sObject';
};

const nodeId = (type: string, name: string) => `${type}:${name}`;
const keyOf = (type: string, name: string) => `${type}:${name.toLowerCase()}`;

/** 単位の主なノードの種類 (定義がないとき) */
const UNIT_NODE_TYPE: Record<string, string> = { anonymousApex: 'anonymousApex' };

// ---------------------------------------------------------------------------
// グラフを作る
// ---------------------------------------------------------------------------

/** 単位ごとの定義と参照から、依存関係のグラフを作る */
export const buildDependencyGraph = (units: readonly GraphUnit[]): DependencyGraph => {
    const nodes = new Map<string, DependencyNode>();
    /** 定義の名前 (小文字) → ノードの id */
    const defined = new Map<string, string>();
    /**
     * 名前 (小文字) → その名前を最初に定義したキー (defined のキー)。メンバーの親を名前で引くのに使う
     * (定義を頭から探すと、メンバーの数 × 定義の数の時間がかかる。大きいリポジトリで数十秒になった)
     */
    const firstKeyByName = new Map<string, string>();
    const define = (type: string, name: string, id: string) => {
        const key = keyOf(type, name);
        defined.set(key, id);
        const lower = name.toLowerCase();
        if (!firstKeyByName.has(lower)) firstKeyByName.set(lower, key);
    };
    /** 定義のある種類 (その種類の参照は「ない」と言える) */
    const definedTypes = new Set<string>();
    const edges: DependencyEdge[] = [];
    /** 候補の参照 (確定した辺の後で、グラフにある参照先だけを辺にする) */
    const candidates: {
        unit: { type: string; id: string };
        unitNode: string;
        reference: UnitReference;
    }[] = [];
    const findings: DependencyFinding[] = [];

    const addNode = (node: DependencyNode) => {
        const existing = nodes.get(node.id);
        if (!existing || (existing.origin !== 'repository' && node.origin === 'repository')) {
            nodes.set(node.id, node);
        } else if (node.traits?.length && existing.origin === 'repository') {
            // オーバーロードなど、同じ名前の定義の性質は合わせる
            existing.traits = [...new Set([...(existing.traits ?? []), ...node.traits])];
        }
        return node.id;
    };

    // 1. 定義 (単位とメンバー)
    const unitNodeOf = new Map<string, string>();
    for (const unit of units) {
        const unitRef = { type: unit.type, id: unit.id };
        const [primary, ...members] = unit.dependencies.definitions;
        const primaryDef: UnitDefinition = primary ?? {
            defType: UNIT_NODE_TYPE[unit.type] ?? unit.type,
            name: unit.id,
        };
        const unitNode = addNode({
            id: nodeId(primaryDef.defType, primaryDef.name),
            type: primaryDef.defType,
            name: primaryDef.name,
            level: 'unit',
            origin: 'repository',
            unit: unitRef,
            ...(primaryDef.sourceKeys ? { sourceKeys: primaryDef.sourceKeys } : {}),
        });
        unitNodeOf.set(`${unit.type}:${unit.id}`, unitNode);
        define(primaryDef.defType, primaryDef.name, unitNode);
        definedTypes.add(primaryDef.defType);
        for (const member of members) {
            // メンバーの親: 名前の . の前までが定義されていればそれ (Outer.Inner.method → Outer.Inner)、なければ単位
            const parentName = member.name.includes('.')
                ? member.name.slice(0, member.name.lastIndexOf('.'))
                : undefined;
            // 単位そのものの名前なら単位 (ワークフローのアラート <オブジェクト>.<名前> をオブジェクトの下にしない)
            const parent =
                (parentName?.toLowerCase() === primaryDef.name.toLowerCase() && unitNode) ||
                (parentName &&
                    (() => {
                        const key = firstKeyByName.get(parentName.toLowerCase());
                        return key === undefined ? undefined : defined.get(key);
                    })()) ||
                unitNode;
            const id = addNode({
                id: nodeId(member.defType, member.name),
                type: member.defType,
                name: member.name,
                level: 'member',
                origin: 'repository',
                parent: parent === nodeId(member.defType, member.name) ? unitNode : parent,
                unit: unitRef,
                ...(member.sourceKeys ? { sourceKeys: member.sourceKeys } : {}),
                ...(member.traits?.length ? { traits: [...member.traits] } : {}),
            });
            define(member.defType, member.name, id);
            definedTypes.add(member.defType);
        }
    }

    const lookup = (type: string, name: string) => defined.get(keyOf(type, name));

    /** 子リレーション (<親>.<名前> (小文字) → 子のオブジェクト) */
    const childRelationships = new Map<string, ChildRelationship>();
    for (const unit of units) {
        for (const relationship of unit.dependencies.childRelationships ?? []) {
            childRelationships.set(
                `${relationship.parent}.${relationship.name}`.toLowerCase(),
                relationship,
            );
        }
    }

    /** 参照項目 (<子>.<項目> (小文字)) → 参照先のオブジェクト (リポジトリのオブジェクトの子リレーションから) */
    const lookupTargets = new Map<string, string>();
    for (const relationship of childRelationships.values()) {
        lookupTargets.set(relationship.field.toLowerCase(), relationship.parent);
    }

    /**
     * SOQL の関係のパス (fieldPath: Contact.Account.Owner.Name) を、2 段目からの参照項目と最後の項目の参照にする
     * (1 段目の参照項目は単位の参照にある)。関係の先のオブジェクトは、リポジトリの参照項目 (子リレーションの表) か、
     * 標準の関係 (STANDARD_RELATIONSHIP_TARGETS・標準オブジェクトの名前)。決まらない関係 (多態など) から先は参照にしない
     */
    const expandFieldPath = (reference: UnitReference): UnitReference[] => {
        if (reference.refType !== 'fieldPath') return [reference];
        const [object = '', ...path] = reference.target.split('.');
        const expanded: UnitReference[] = [];
        let current = object;
        for (let i = 0; i < path.length - 1; i++) {
            const relationship = path[i]!;
            const field = /__r$/i.test(relationship)
                ? relationship.replace(/__r$/i, '__c')
                : `${relationship}Id`;
            if (i > 0)
                expanded.push({ ...reference, refType: 'field', target: `${current}.${field}` });
            const next =
                lookupTargets.get(`${current}.${field}`.toLowerCase()) ??
                (/__r$/i.test(relationship)
                    ? undefined
                    : (STANDARD_RELATIONSHIP_TARGETS[relationship.toLowerCase()] ??
                      (relationship.toLowerCase() === 'parent' ||
                      relationship.toLowerCase() === 'masterrecord'
                          ? current
                          : isStandardObjectName(relationship) &&
                              relationship.toLowerCase() !== 'sobject'
                            ? relationship
                            : undefined)));
            if (!next) return expanded;
            current = next;
        }
        expanded.push({
            ...reference,
            refType: 'field',
            target: `${current}.${path[path.length - 1]}`,
        });
        return expanded;
    };

    /**
     * サブクエリの子リレーション (Account.Contacts) と、その項目 (Account.Contacts.LastName)。
     * 子リレーションが分かれば子のオブジェクト・その項目にする
     */
    const resolveChildRelationship = (
        refType: string,
        target: string,
    ): { refType: string; target: string } | string => {
        const [parent = '', name = '', ...rest] = target.split('.');
        const relationship = childRelationships.get(`${parent}.${name}`.toLowerCase());
        if (relationship) {
            return refType === 'childRelationship'
                ? { refType: 'object', target: relationship.child }
                : { refType: 'field', target: `${relationship.child}.${rest.join('.')}` };
        }
        // 標準の子リレーション (Contacts) はリポジトリにない。カスタム (__r) は、オブジェクトがあれば「ない」
        const custom = /__r$/i.test(name);
        const origin: NodeOrigin =
            isNamespaced(name) || isNamespaced(parent)
                ? 'managed'
                : !custom
                  ? // 標準の子リレーションは、親が標準のオブジェクトのときだけ standard (名前そのものは一覧で確かめない)
                    isStandardObjectName(parent)
                      ? 'standard'
                      : 'unknown'
                  : refType === 'childRelationship' && definedTypes.has('object')
                    ? 'missing'
                    : 'unknown';
        return addNode({
            id: nodeId(refType, target),
            type: refType,
            name: target,
            level: refType === 'childRelationship' ? 'unit' : 'member',
            origin,
        });
    };

    /** Apex の型の名前を、クラスかオブジェクトか標準の型にする */
    const resolveApexType = (
        name: string,
        fromUnitNode?: string,
    ): { type: string; name: string; id?: string } => {
        const cls = lookup('apexClass', name);
        if (cls) return { type: 'apexClass', name: nodes.get(cls)!.name, id: cls };
        // 内側のクラス (同じクラスの中から Inner と書いたもの)
        if (fromUnitNode) {
            const outer = nodes.get(fromUnitNode);
            const inner = outer && lookup('apexClass', `${outer.name}.${name}`);
            if (inner) return { type: 'apexClass', name: nodes.get(inner)!.name, id: inner };
        }
        const object = lookup('object', name);
        if (object) return { type: 'object', name: nodes.get(object)!.name, id: object };
        if (isCustom(name) || isStandardObjectName(name)) return { type: 'object', name };
        return { type: 'apexType', name };
    };

    /** 参照先のノード (なければ作る) */
    const resolveTarget = (reference: UnitReference, fromUnitNode: string): string => {
        // 参照の種類の名前は定義の種類と同じ (語彙は 1 つ。docs/json-redesign-plan.md の段階 M2)
        let refType: string = reference.refType;
        let target = reference.target;
        if (refType === 'childRelationship' || refType === 'childRelationshipField') {
            const resolved = resolveChildRelationship(refType, target);
            if (typeof resolved === 'string') return resolved;
            ({ refType, target } = resolved);
        }
        if (refType === 'apexType') {
            const resolved = resolveApexType(target, fromUnitNode);
            if (resolved.id) return resolved.id;
            refType = resolved.type;
            target = resolved.name;
        } else if (refType === 'apexTypeMember' || refType === 'apexMethod') {
            const dot = target.lastIndexOf('.');
            const owner = resolveApexType(target.slice(0, dot), fromUnitNode);
            const member = target.slice(dot + 1);
            if (owner.type === 'object') {
                refType = 'field';
                target = `${owner.name}.${member}`;
            } else if (owner.type === 'apexClass') {
                const found =
                    lookup('apexMethod', `${owner.name}.${member}`) ??
                    lookup('apexProperty', `${owner.name}.${member}`);
                if (found) return found;
                // 継承したメンバー・標準のメソッドかもしれないので「ない」とは言わない (@salesforce/apex は除く)
                return addNode({
                    id: nodeId('apexMember', `${owner.name}.${member}`),
                    type: 'apexMember',
                    name: `${owner.name}.${member}`,
                    level: 'member',
                    origin: reference.via === 'import' ? 'missing' : 'unknown',
                    ...(owner.id ? { parent: owner.id } : {}),
                });
            } else {
                // 標準のクラス (System.debug など)
                return addNode({
                    id: nodeId('apexType', owner.name),
                    type: 'apexType',
                    name: owner.name,
                    level: 'unit',
                    origin: isNamespaced(owner.name)
                        ? 'managed'
                        : isApexStandardTypeName(owner.name)
                          ? 'standard'
                          : 'unknown',
                });
            }
        }
        const found =
            lookup(refType, target) ??
            // c:<名前> の部品 (Aura・FlexiPage・Flow の画面から) は LWC か Aura のどちらか。LWC の import・テンプレートは LWC だけ
            (refType === 'lwc' && reference.via !== 'import' && reference.via !== 'template'
                ? lookup('aura', target)
                : undefined);
        if (found) return found;

        // リポジトリにないもの
        const origin = originOf(refType, target);
        const parentObject = refType === 'field' ? target.split('.')[0] : undefined;
        const parent = parentObject
            ? (lookup('object', parentObject) ?? addObjectNode(parentObject))
            : undefined;
        return addNode({
            id: nodeId(refType, target),
            type: refType,
            name: target,
            level: refType === 'field' || refType === 'apexMember' ? 'member' : 'unit',
            origin,
            ...(parent ? { parent } : {}),
        });
    };

    const addObjectNode = (name: string): string =>
        addNode({
            id: nodeId('object', name),
            type: 'object',
            name,
            level: 'unit',
            origin: originOf('object', name),
        });

    const originOf = (refType: string, target: string): NodeOrigin => {
        if (refType === 'globalVariable') return 'standard';
        // c 以外の名前空間の部品 (Flow の画面の forceContent:fileUpload など) は標準
        if (refType === 'aura' && /^\w+:/.test(target) && !/^c:/i.test(target)) return 'standard';
        const [head] = target.split('.');
        if (isNamespaced(head ?? target) || isNamespaced(target.split('.').pop() ?? ''))
            return 'managed';
        // Apex の型: 標準の型の一覧にあるものだけ standard
        if (refType === 'apexType') return isApexStandardTypeName(target) ? 'standard' : 'unknown';
        if (refType === 'object') {
            if (!isCustom(target)) return isStandardObjectName(target) ? 'standard' : 'unknown';
            return definedTypes.has('object') ? 'missing' : 'unknown';
        }
        if (refType === 'field') {
            const [object = '', field = ''] = target.split('.');
            // 標準の項目: 標準のオブジェクトの項目か、どのオブジェクトにもある項目
            if (!isCustom(field))
                return isStandardObjectName(object) ||
                    COMMON_STANDARD_FIELDS.has(field.toLowerCase())
                    ? 'standard'
                    : 'unknown';
            // オブジェクトが (定義として) リポジトリにあるのに項目がない
            return object && lookup('object', object)
                ? 'missing'
                : definedTypes.has('object') && isCustom(object ?? '')
                  ? 'missing'
                  : 'unknown';
        }
        return definedTypes.has(refType) ? 'missing' : 'unknown';
    };

    // 2. 参照 (文・式のノードと辺)
    /** 名前 (小文字) と単位の id → 最初に定義したノード (メンバーの名前で引くのに使う。頭から探すと二乗の時間になる) */
    const memberByNameAndUnit = new Map<string, string>();
    for (const id of defined.values()) {
        const node = nodes.get(id)!;
        const key = `${node.name.toLowerCase()}|${node.unit?.id ?? ''}`;
        if (!memberByNameAndUnit.has(key)) memberByNameAndUnit.set(key, id);
    }
    for (const unit of units) {
        const unitNode = unitNodeOf.get(`${unit.type}:${unit.id}`)!;
        const unitRef = { type: unit.type, id: unit.id };
        for (const reference of unit.dependencies.references.flatMap(expandFieldPath)) {
            if (reference.resolution === 'candidates') {
                candidates.push({ unit: unitRef, unitNode, reference });
                continue;
            }
            const { member, statement, expression } = reference.from;
            const memberNode = member
                ? (lookup('apexMethod', member) ??
                  lookup('apexProperty', member) ??
                  lookup('apexClass', member) ??
                  lookup('apexTrigger', member) ??
                  memberByNameAndUnit.get(`${member.toLowerCase()}|${unit.id}`))
                : undefined;
            let from = memberNode ?? unitNode;
            if (statement) {
                from = addNode({
                    id: `site:${unitNode}:${statement.sourceKey}`,
                    type: 'statement',
                    name: statement.sourceKey,
                    level: 'site',
                    origin: 'repository',
                    parent: memberNode ?? unitNode,
                    unit: unitRef,
                    sourceKeys: statement,
                });
            }
            if (expression && expression.sourceKey !== statement?.sourceKey) {
                from = addNode({
                    id: `site:${unitNode}:${expression.sourceKey}`,
                    type: 'expression',
                    name: expression.sourceKey,
                    level: 'site',
                    origin: 'repository',
                    parent: from,
                    unit: unitRef,
                    sourceKeys: expression,
                });
            }
            const to = resolveTarget(reference, unitNode);
            const target = nodes.get(to)!;
            const resolution = edgeResolutionOf(target.origin, reference.resolution);
            edges.push({
                from,
                to,
                kind: reference.kind,
                via: reference.via,
                unit: unitRef,
                ...(resolution ? { resolution } : {}),
            });
            // 子のコンポーネント自体がないときの @api (<バンドル>.<プロパティ>) は、UNKNOWN_LWC と同じ原因なので重ねて出さない
            const ownerMissing =
                target.type === 'lwcProperty' && !lookup('lwc', target.name.split('.')[0]!);
            if (target.origin === 'missing' && !ownerMissing) {
                findings.push({
                    // 今までの参照の解析と同じ名前 (UNKNOWN_FIELD / UNKNOWN_APEX_CLASS など)
                    code: `UNKNOWN_${target.type.replace(/[A-Z]/g, (c) => `_${c}`).toUpperCase()}`,
                    severity: 'warning',
                    target: to,
                    from,
                    message: `${target.type} ${target.name} is not in the repository (${unit.type} ${unit.id}, ${reference.via})`,
                });
            }
            const lightningFinding = lightningApexFindingOf(target, reference.via);
            if (lightningFinding) {
                findings.push({
                    ...lightningFinding,
                    severity: 'warning',
                    target: to,
                    from,
                    message: `${lightningFinding.message} (${unit.type} ${unit.id})`,
                });
            }
        }
    }

    // 候補の参照: 参照先がグラフにある (定義がある) ものだけを、メンバーの細かさで辺にする
    const candidateEdges: DependencyEdge[] = [];
    for (const { unit, unitNode, reference } of candidates) {
        const member = reference.from.member;
        const from =
            (member &&
                (lookup('apexMethod', member) ??
                    lookup('apexProperty', member) ??
                    lookup('apexClass', member) ??
                    lookup('apexTrigger', member))) ||
            unitNode;
        const to = lookup(reference.refType, reference.target);
        if (to) candidateEdges.push({ from, to, kind: reference.kind, via: reference.via, unit });
    }

    return { nodes, edges, findings: dedupeFindings(findings), candidateEdges };
};

/**
 * ない参照先の指摘を、「参照している単位 + 行の sourceKeys」の形にしたもの (docs/plan.md 10 章 P3)。
 * 参照先がリポジトリにあるかの確かめは、グラフのこの指摘に一本化した (種類ごとの解析は、その種類の中の決まりだけを見る)
 */
export type ReferenceFinding = {
    code: string;
    severity: DependencyFinding['severity'];
    message: string;
    /** 参照先 (ノードの id・種類・名前) */
    target: { id: string; type: string; name: string };
    /** 参照している単位 (種類と id)。分からなければ持たない */
    unit?: { type: string; id: string };
    /** 参照している単位のノードの名前 (AccountService・Invoice_Status_Update など) */
    unitName: string;
    /** 参照している行 (文・式・メンバーの宣言) の位置 */
    sourceKeys?: ConvertKeys;
};

/** グラフの、ない参照先の指摘 */
/**
 * LWC から使う Apex のメソッドの決まり (@salesforce/apex の import は @AuraEnabled、@wire は cacheable=true)。
 * リポジトリにあるメソッドだけ見る (ないものは UNKNOWN_APEX_MEMBER)
 */
const lightningApexFindingOf = (
    target: DependencyNode,
    via: string,
): { code: string; message: string } | undefined => {
    if (target.type !== 'apexMethod' || target.origin !== 'repository') return undefined;
    const traits = target.traits ?? [];
    if (via === 'import' && !traits.includes('auraEnabled'))
        return {
            code: 'APEX_METHOD_NOT_AURA_ENABLED',
            message: `apexMethod ${target.name} is imported from @salesforce/apex but is not @AuraEnabled`,
        };
    if (via === 'wire' && traits.includes('auraEnabled') && !traits.includes('cacheable'))
        return {
            code: 'APEX_METHOD_NOT_CACHEABLE',
            message: `apexMethod ${target.name} is used with @wire but is not @AuraEnabled(cacheable=true)`,
        };
    return undefined;
};

/** 辺の確かさ (DependencyEdge.resolution)。参照先のノードの由来で決め、決まらなければ単位の参照の確かさ */
const edgeResolutionOf = (
    origin: NodeOrigin,
    resolution: UnitReference['resolution'],
): DependencyEdge['resolution'] => {
    if (origin === 'repository') return 'resolved';
    if (origin === 'missing') return 'missing';
    if (origin === 'standard') return 'standard';
    return resolution === 'candidates' ? undefined : resolution;
};

export const referenceFindingsOf = (graph: DependencyGraph): ReferenceFinding[] =>
    graph.findings.map((finding) => {
        const unitNode = graph.nodes.get(toLevel(graph, finding.from, 'unit'));
        const site = graph.nodes.get(finding.from);
        const target = graph.nodes.get(finding.target)!;
        const unit = site?.unit ?? unitNode?.unit;
        return {
            code: finding.code,
            severity: finding.severity,
            message: finding.message,
            target: { id: target.id, type: target.type, name: target.name },
            ...(unit ? { unit } : {}),
            unitName: unitNode?.name ?? finding.from,
            ...(site?.sourceKeys ? { sourceKeys: site.sourceKeys } : {}),
        };
    });

const dedupeFindings = (findings: DependencyFinding[]) => {
    const seen = new Set<string>();
    return findings.filter((f) => {
        const key = `${f.code}|${f.target}|${f.from}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
};

// ---------------------------------------------------------------------------
// たどる
// ---------------------------------------------------------------------------

/** ノードを、指定の細かさのノードにする (文・式 → メンバー → 単位) */
export const toLevel = (graph: DependencyGraph, id: string, level: NodeLevel): string => {
    const order: NodeLevel[] = ['unit', 'member', 'site'];
    let current = graph.nodes.get(id);
    while (current && order.indexOf(current.level) > order.indexOf(level) && current.parent) {
        current = graph.nodes.get(current.parent);
    }
    return current?.id ?? id;
};

/** ノードとその下のノード (単位なら、メンバーと文・式も) */
const withDescendants = (graph: DependencyGraph, id: string): Set<string> => {
    const children = new Map<string, string[]>();
    for (const node of graph.nodes.values()) {
        if (node.parent) children.set(node.parent, [...(children.get(node.parent) ?? []), node.id]);
    }
    const found = new Set<string>([id]);
    const stack = [id];
    while (stack.length) {
        for (const child of children.get(stack.pop()!) ?? []) {
            if (!found.has(child)) {
                found.add(child);
                stack.push(child);
            }
        }
    }
    return found;
};

export type TraverseOptions = {
    /** たどる段数 (既定 1) */
    depth?: number;
    /** 結果のノードの細かさ (既定 unit) */
    level?: NodeLevel;
    /** 辺の種類で絞る */
    kinds?: readonly DependencyKind[];
};

const traverse = (
    graph: DependencyGraph,
    start: string,
    direction: 'out' | 'in',
    options: TraverseOptions,
): Map<string, number> => {
    const depth = options.depth ?? 1;
    const level = options.level ?? 'unit';
    const kinds = options.kinds ? new Set(options.kinds) : undefined;
    const result = new Map<string, number>();
    let frontier = new Set([start]);
    for (let step = 1; step <= depth && frontier.size; step++) {
        const next = new Set<string>();
        for (const id of frontier) {
            const sources = withDescendants(graph, id);
            for (const edge of graph.edges) {
                if (kinds && !kinds.has(edge.kind)) continue;
                const [here, there] =
                    direction === 'out' ? [edge.from, edge.to] : [edge.to, edge.from];
                if (!sources.has(here)) continue;
                const found = toLevel(graph, there, level);
                const unitOfFound = toLevel(graph, found, 'unit');
                // 自分の中の参照は除く
                if (unitOfFound === toLevel(graph, start, 'unit') && level === 'unit') continue;
                if (!result.has(found) && found !== start) {
                    result.set(found, step);
                    next.add(found);
                }
            }
        }
        frontier = next;
    }
    return result;
};

/** 依存先 (node が使っているもの)。値は何段目で見つかったか */
export const getDependencies = (
    graph: DependencyGraph,
    node: string,
    options: TraverseOptions = {},
) => traverse(graph, node, 'out', options);

/** 被依存 (node を使っているもの)。単位を渡すと、メンバー (項目など) を使っているものも含む */
export const getDependents = (
    graph: DependencyGraph,
    node: string,
    options: TraverseOptions = {},
) => traverse(graph, node, 'in', options);

/**
 * 変更の影響: 変更した単位 (ノード) から被依存をたどり、変更していないが影響を受ける単位。
 * 値は何段目で見つかったか
 */
export const getImpact = (
    graph: DependencyGraph,
    changed: readonly string[],
    depth = 2,
): Map<string, number> => {
    const changedUnits = new Set(changed.map((id) => toLevel(graph, id, 'unit')));
    const impact = new Map<string, number>();
    for (const id of changed) {
        for (const [found, step] of getDependents(graph, id, { depth, level: 'unit' })) {
            if (changedUnits.has(found)) continue;
            if (!impact.has(found) || impact.get(found)! > step) impact.set(found, step);
        }
    }
    return impact;
};

// ---------------------------------------------------------------------------
// 依存の差分・使われていないもの・循環・順序
// ---------------------------------------------------------------------------

/** 依存 1 つ (メンバーの細かさ。位置が変わっただけでは変わらない) */
export type DependencyKey = { from: string; to: string; kind: DependencyKind };

const memberEdges = (graph: DependencyGraph): Map<string, DependencyKey> =>
    new Map(
        graph.edges.map((edge) => {
            const key = { from: toLevel(graph, edge.from, 'member'), to: edge.to, kind: edge.kind };
            return [`${key.from}|${key.to}|${key.kind}`, key];
        }),
    );

/** before / after の依存の増減 (メンバーの細かさで比べる) */
export const diffDependencies = (
    before: DependencyGraph,
    after: DependencyGraph,
): { added: DependencyKey[]; removed: DependencyKey[] } => {
    const b = memberEdges(before);
    const a = memberEdges(after);
    return {
        added: [...a].filter(([key]) => !b.has(key)).map(([, value]) => value),
        removed: [...b].filter(([key]) => !a.has(key)).map(([, value]) => value),
    };
};

/** 使われていないものの候補にする種類 (入口になるもの (トリガー・権限セット・画面など) は除く) */
const UNUSED_CANDIDATE_TYPES = new Set([
    'field',
    'customLabel',
    'customPermission',
    'staticResource',
    'lwc',
    'apexClass',
]);

/** リポジトリにあって、ほかの単位から使われていないもの (掃除の候補)。カスタム項目だけを見る */
export const getUnused = (graph: DependencyGraph): DependencyNode[] => {
    const used = new Set<string>();
    for (const edge of graph.edges) {
        const fromUnit = toLevel(graph, edge.from, 'unit');
        if (
            toLevel(graph, edge.to, 'unit') !== fromUnit ||
            graph.nodes.get(edge.to)?.level !== 'unit'
        ) {
            used.add(edge.to);
        }
    }
    return [...graph.nodes.values()]
        .filter(
            (node) =>
                node.origin === 'repository' &&
                UNUSED_CANDIDATE_TYPES.has(node.type) &&
                // 項目はカスタム項目だけ、Apex は外側のクラスだけ
                (node.type === 'field'
                    ? isCustom(node.name.split('.').pop() ?? '')
                    : node.type !== 'apexClass' || node.level === 'unit') &&
                !used.has(node.id),
        )
        .sort((a, b) => a.id.localeCompare(b.id));
};

/** 単位の細かさの依存 (自分への依存を除く) */
const unitEdges = (graph: DependencyGraph): Map<string, Set<string>> => {
    const out = new Map<string, Set<string>>();
    for (const edge of graph.edges) {
        const from = toLevel(graph, edge.from, 'unit');
        const to = toLevel(graph, edge.to, 'unit');
        if (from === to || graph.nodes.get(to)?.origin !== 'repository') continue;
        out.set(from, (out.get(from) ?? new Set()).add(to));
    }
    return out;
};

/** 依存の循環 (単位の細かさ。2 つ以上の単位からなる強連結成分) */
export const getCycles = (graph: DependencyGraph): string[][] => {
    const out = unitEdges(graph);
    const index = new Map<string, number>();
    const low = new Map<string, number>();
    const stack: string[] = [];
    const onStack = new Set<string>();
    const cycles: string[][] = [];
    let counter = 0;
    const visit = (v: string) => {
        index.set(v, counter);
        low.set(v, counter++);
        stack.push(v);
        onStack.add(v);
        for (const w of out.get(v) ?? []) {
            if (!index.has(w)) {
                visit(w);
                low.set(v, Math.min(low.get(v)!, low.get(w)!));
            } else if (onStack.has(w)) {
                low.set(v, Math.min(low.get(v)!, index.get(w)!));
            }
        }
        if (low.get(v) === index.get(v)) {
            const component: string[] = [];
            let w: string;
            do {
                w = stack.pop()!;
                onStack.delete(w);
                component.push(w);
            } while (w !== v);
            if (component.length > 1) cycles.push(component.sort());
        }
    };
    const units = [...graph.nodes.values()]
        .filter((n) => n.level === 'unit' && n.origin === 'repository')
        .map((n) => n.id)
        .sort();
    for (const v of units) if (!index.has(v)) visit(v);
    return cycles;
};

/**
 * デプロイの順序: 依存先が先に来る単位の並び (循環しているものは、まとめて 1 段に置く)。
 * 1 段ごとの配列で、同じ段の単位は互いに依存しない
 */
export const getDeploymentOrder = (graph: DependencyGraph): string[][] => {
    const out = unitEdges(graph);
    const units = [...graph.nodes.values()]
        .filter((n) => n.level === 'unit' && n.origin === 'repository')
        .map((n) => n.id);
    // 循環をまとめる
    const groupOf = new Map<string, string>(units.map((u) => [u, u]));
    for (const cycle of getCycles(graph)) for (const u of cycle) groupOf.set(u, cycle[0]!);
    const members = new Map<string, string[]>();
    for (const u of units)
        members.set(groupOf.get(u)!, [...(members.get(groupOf.get(u)!) ?? []), u]);
    const depends = new Map<string, Set<string>>();
    for (const [from, tos] of out) {
        for (const to of tos) {
            const [a, b] = [groupOf.get(from), groupOf.get(to)];
            if (a && b && a !== b) depends.set(a, (depends.get(a) ?? new Set()).add(b));
        }
    }
    const done = new Set<string>();
    const levels: string[][] = [];
    let remaining = [...members.keys()];
    while (remaining.length) {
        const ready = remaining.filter((g) =>
            [...(depends.get(g) ?? [])].every((d) => done.has(d)),
        );
        if (!ready.length) break;
        levels.push(ready.flatMap((g) => members.get(g)!).sort());
        ready.forEach((g) => done.add(g));
        remaining = remaining.filter((g) => !done.has(g));
    }
    return levels;
};

// ---------------------------------------------------------------------------
// 書き出し
// ---------------------------------------------------------------------------

const mermaidId = (id: string) => `n_${id.replace(/[^A-Za-z0-9_]/g, '_')}`;

/** 単位の細かさの図 (Mermaid の flowchart)。nodes を渡すと、そのノードの間だけ */
export const toMermaid = (graph: DependencyGraph, nodes?: ReadonlySet<string>): string => {
    const lines = ['flowchart LR'];
    const seen = new Set<string>();
    const declare = (id: string) => {
        if (seen.has(id)) return;
        seen.add(id);
        const node = graph.nodes.get(id)!;
        const label = `${node.type}: ${node.name}`.replace(/"/g, "'");
        lines.push(
            `    ${mermaidId(id)}["${label}"]${node.origin === 'missing' ? ':::missing' : ''}`,
        );
    };
    for (const [from, tos] of unitEdgesAll(graph)) {
        for (const to of tos) {
            if (nodes && !(nodes.has(from) && nodes.has(to))) continue;
            declare(from);
            declare(to);
            lines.push(`    ${mermaidId(from)} --> ${mermaidId(to)}`);
        }
    }
    lines.push('    classDef missing stroke:#d33,stroke-dasharray: 4 2');
    return lines.join('\n');
};

/** 単位の細かさの図 (Graphviz の DOT) */
export const toDot = (graph: DependencyGraph, nodes?: ReadonlySet<string>): string => {
    const lines = ['digraph dependencies {', '    rankdir=LR;'];
    for (const [from, tos] of unitEdgesAll(graph)) {
        for (const to of tos) {
            if (nodes && !(nodes.has(from) && nodes.has(to))) continue;
            lines.push(`    ${JSON.stringify(from)} -> ${JSON.stringify(to)};`);
        }
    }
    lines.push('}');
    return lines.join('\n');
};

/** 単位の細かさの依存 (リポジトリにないものへの依存も含む。標準のものは除く) */
const unitEdgesAll = (graph: DependencyGraph): Map<string, Set<string>> => {
    const out = new Map<string, Set<string>>();
    for (const edge of graph.edges) {
        const from = toLevel(graph, edge.from, 'unit');
        const to = toLevel(graph, edge.to, 'unit');
        const origin = graph.nodes.get(to)?.origin;
        if (from === to || origin === 'standard' || origin === 'unknown') continue;
        out.set(from, (out.get(from) ?? new Set()).add(to));
    }
    return new Map([...out].sort(([a], [b]) => a.localeCompare(b)));
};

/** ノード (単位・項目など) の package.xml。種類ごとに名前の順。apiVersion は sfdx-project.json の sourceApiVersion など */
export const toPackageXml = (
    graph: DependencyGraph,
    ids: readonly string[],
    apiVersion = '62.0',
): string => {
    const byType = new Map<string, Set<string>>();
    for (const id of ids) {
        const node = graph.nodes.get(id);
        const typeName = node && METADATA_TYPE_NAMES[node.type];
        if (!node || !typeName) continue;
        byType.set(typeName, (byType.get(typeName) ?? new Set()).add(node.name));
    }
    const types = [...byType]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(
            ([name, members]) =>
                `    <types>\n${[...members]
                    .sort()
                    .map((member) => `        <members>${member}</members>`)
                    .join('\n')}\n        <name>${name}</name>\n    </types>`,
        );
    return [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<Package xmlns="http://soap.sforce.com/2006/04/metadata">',
        ...types,
        `    <version>${apiVersion}</version>`,
        '</Package>',
        '',
    ].join('\n');
};
