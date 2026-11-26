import { findStandardObject, isCustomObjectName } from '../../commons/standardObjects';
import {
    type ApexStandardType,
    findApexStandardNamespace,
    findApexStandardType,
} from './standardTypes';

// 名前の並び (`Database.query`・`Database.Batchable`・`Schema.Account.SObjectType`・`String`) を、
// 標準の型・SObject・名前空間に当てる (docs/plan.md 2.2・10 章 P2)。
// - 先頭から最も長く一致する型を取る。`Database.Batchable` は Database 名前空間の Batchable、
//   `Database.query` の `Database` は System.Database クラス (名前空間を省いた System の型)
// - 名前空間を省いた名前は System の型、次に SObject (`Account` は Schema.Account) として引く
// - 単位の中の宣言・リポジトリの定義に同じ名前があれば、そちらを優先する (呼び出し側が isUserType で知らせる)。
//   名前空間を書いた名前 (`System.Test`) は、ユーザーの型より標準を優先する
// - 一覧にない名前は undefined (「標準に存在しない」とは判定しない。呼び出し側で unknown にする)

/** 標準の名前の照合の結果。members は型のあとに続く名前 (静的なメンバー・項目など) */
export type ApexStandardName =
    | { kind: 'type'; type: ApexStandardType; members: string[]; qualified: boolean }
    | {
          kind: 'sObject';
          /** 書いた名前 (Schema. は外す) */
          object: string;
          /** 標準オブジェクトの一覧に載っているか (false はカスタムの接尾辞で判断したもの) */
          listed: boolean;
          members: string[];
          qualified: boolean;
      }
    /** 名前空間だけが一致した (その名前空間の、一覧にない型など) */
    | { kind: 'namespace'; namespace: string; members: string[] };

export type ApexStandardNameOptions = {
    /** 単位の中の宣言・リポジトリの定義の型か (名前の並びの先頭から、その長さの部分) */
    isUserType?: (path: readonly string[]) => boolean;
};

/** SObject の名前か (標準オブジェクトの一覧か、カスタムの接尾辞) */
const sObjectOf = (name: string): { listed: boolean } | undefined => {
    if (findStandardObject(name)) return { listed: true };
    if (isCustomObjectName(name)) return { listed: false };
    return undefined;
};

/** 名前の並びを標準の名前に当てる */
export const resolveApexStandardName = (
    path: readonly string[],
    options: ApexStandardNameOptions = {},
): ApexStandardName | undefined => {
    const [first, second] = path;
    if (!first) return undefined;
    const isUserType = options.isUserType ?? (() => false);

    // 名前空間.型 (入れ子の型を含む。長いものから)
    const namespace = findApexStandardNamespace(first);
    if (namespace) {
        for (let length = path.length; length >= 2; length--) {
            const type = findApexStandardType(path.slice(0, length).join('.'));
            if (type) {
                return { kind: 'type', type, members: path.slice(length), qualified: true };
            }
        }
        // Schema.Account
        if (namespace === 'Schema' && second) {
            const sObject = sObjectOf(second);
            if (sObject) {
                return {
                    kind: 'sObject',
                    object: second,
                    listed: sObject.listed,
                    members: path.slice(2),
                    qualified: true,
                };
            }
        }
    }

    // 名前空間を省いた System の型 (ユーザーの型が優先)
    if (!isUserType(path.slice(0, 1))) {
        for (let length = path.length; length >= 1; length--) {
            const type = findApexStandardType(['System', ...path.slice(0, length)].join('.'));
            if (type) {
                return { kind: 'type', type, members: path.slice(length), qualified: false };
            }
        }
        const sObject = sObjectOf(first);
        if (sObject) {
            return {
                kind: 'sObject',
                object: first,
                listed: sObject.listed,
                members: path.slice(1),
                qualified: false,
            };
        }
    }

    // 名前空間だけ一致 (一覧にない型。`Flowtesting` のように型が動的に作られるものもある)
    return namespace && !isUserType(path.slice(0, 1))
        ? { kind: 'namespace', namespace, members: path.slice(1) }
        : undefined;
};
