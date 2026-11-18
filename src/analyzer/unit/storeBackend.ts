import type { UnitDependencies } from '../processor/dependency/types';
import type { FileStat } from './sourceTree';
import type { UnitParseResult } from './unitType';

// 保存の置き場の「保存の仕方」(docs/implementation-roadmap.md 5.7 の Q1)。
// 単位の判定・hash・parse の使い回しは UnitStore (store.ts) が行い、ここは読み書きだけを持つ。
// 実装は SQLite (storeSqlite.ts)。版の確かめ (置き場所の版・解析結果の版・派生の版) も backend が行う

/** 単位のファイル 1 つ (リポジトリからの相対パスと、中身の hash) */
export type ManifestFile = { path: string; hash: string };

/** 保存した時点の単位 1 つ */
export type ManifestUnit = {
    /** 単位の種類 */
    type: string;
    /** 単位の場所 (リポジトリからの相対パス) */
    location: string;
    /** filesOf のファイル (読めたもの。名前の順) */
    files: ManifestFile[];
    /** hash(type, location, files)。解析結果の保存名 */
    key: string;
};

export type Manifest = { layoutVersion: number; units: ManifestUnit[] };

/** ファイル 1 つの、hash を取ったときの大きさ・更新時刻 (S5) */
export type FileStatEntry = FileStat & { hash: string; checkedAt: number };

/** 単位のファイルの中身 (解析結果を書くときに、位置からソースの文字列を作れるように渡す) */
export type UnitSourceFile = ManifestFile & { text: string };

/** ノード (JsonType・StructureJsonType の行) の検索 (docs/implementation-roadmap.md 5 章の Q4) */
export type NodeQuery = {
    /** 探す単位の key (今の状態・前回の基準の単位だけを見るため) */
    unitKeys: readonly string[];
    /** ノードの種類。* は任意の文字列 (例: method・soql・flow*)。省略ですべて */
    kind?: string;
    /** objectKey に含まれる文字列 (大文字・小文字を区別する)。省略ですべて */
    objectKey?: string;
    limit: number;
    offset?: number;
};

/** 見つかったノード 1 つ (名前・種類・位置だけ。中身は返さない) */
export type NodeHit = {
    unitKey: string;
    kind: string;
    objectKey: string | null;
    /** 親のノードの中での場所 (例: $.methods[0]。根のノードは $.result.base など) */
    path: string;
    /** ソースのファイル (リポジトリからの相対パス)。位置がなければ null */
    filePath: string | null;
    startLine: number | null;
    endLine: number | null;
};

/** ノードの種類ごとの数 */
export type NodeKindCount = { unitType: string; kind: string; count: number };

export interface StoreBackend {
    /** 今の置き場所の版の目録。なければ・版が違えば undefined */
    readManifest(): Promise<Manifest | undefined>;
    /** 保存した解析結果 (filePath はリポジトリからの相対パス)。なければ・版が違えば undefined */
    readParsed(
        type: string,
        key: string,
        formatVersion: string,
    ): Promise<UnitParseResult | undefined>;
    hasParsed(type: string, key: string, formatVersion: string): Promise<boolean>;
    /** 解析結果を書く (filePath はリポジトリからの相対パス)。files は単位のファイルの中身 (分かれば) */
    writeParsed(
        type: string,
        key: string,
        formatVersion: string,
        data: UnitParseResult,
        files?: readonly UnitSourceFile[],
    ): Promise<void>;
    readDerived(
        type: string,
        key: string,
        formatVersion: string,
        derivedVersion: number,
    ): Promise<UnitDependencies | undefined>;
    writeDerived(
        type: string,
        key: string,
        formatVersion: string,
        derivedVersion: number,
        data: UnitDependencies,
    ): Promise<void>;
    readSource(hash: string): Promise<string | undefined>;
    hasSource(hash: string): Promise<boolean>;
    writeSource(hash: string, text: string): Promise<void>;
    /**
     * fn の中の書き込み (読み込みの途中で書く、使い回すための解析結果) を 1 つのトランザクションにまとめる。
     * 単位ごとに確定すると、大きいリポジトリで確定だけに時間がかかる (NPSP で 12 秒)。
     * fn が失敗しても、それまでに書いた単位は確定する (どれも 1 単位として正しく書けている)
     */
    batch<T>(fn: () => Promise<T>): Promise<T>;
    /** 保存を始める (SQLite はトランザクション) */
    begin(): Promise<void>;
    /** 目録を書いて保存を終える。目録にない解析結果・定義・参照・ソースは消す */
    commit(manifest: Manifest): Promise<void>;
    /** 保存を取りやめる (途中で止まったとき。前の目録が残る) */
    rollback(): Promise<void>;
    readFileStats(): Promise<Map<string, FileStatEntry>>;
    writeFileStats(entries: [string, FileStatEntry][]): Promise<void>;
    /** ノードを探す (unitKeys の単位だけ。単位・ファイル・位置の順)。total は limit をかける前の数 */
    findNodes(query: NodeQuery): Promise<{ total: number; nodes: NodeHit[] }>;
    /** unitKeys の単位のノードの、単位の種類・ノードの種類ごとの数 (多い順) */
    countNodeKinds(unitKeys: readonly string[]): Promise<NodeKindCount[]>;
    close(): void;
}
