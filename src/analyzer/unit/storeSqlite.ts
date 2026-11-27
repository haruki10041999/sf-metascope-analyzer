import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync, type StatementSync } from 'node:sqlite';
import zlib from 'node:zlib';

import { SAVE_FORMAT_VERSION } from '../parser/commons';
import type { UnitDependencies } from '../processor/dependency/types';

import type {
    FileStatEntry,
    Manifest,
    NodeHit,
    NodeKindCount,
    NodeQuery,
    ReferenceHit,
    ReferenceQuery,
    StoreBackend,
    MetricHit,
    MetricQuery,
    SymbolHit,
    SymbolQuery,
    UnitSourceFile,
} from './storeBackend';
import { type SpanRow, flattenUnit, rebuildUnit } from './storeTree';
import type { UnitParseResult } from './unitType';

// 保存の置き場の SQLite (node:sqlite) の backend (docs/implementation-roadmap.md 5.3・5.7 の Q1)。
// ファイル: <置き場>/metascope.db。表:
//   meta (置き場所の版) / source (hash → LF にそろえた中身) / snapshot (before の目録)
//   unit (番号・key・種類・解析結果の版・根) / unit_file (単位のファイルと hash)
//   node (JsonType を 1 行。子は親の中身の {"$node": 番号}) / span (sourceObject の位置)
//   derived (定義・参照) / symbol (定義の行) / reference (参照の行) / file_stat (作業ツリーのファイルの大きさ・更新時刻・hash)
// - symbol・reference は derived と同じ中身を行にしたもの (docs/plan.md 6.2。単位をまたぐ名前の引き当て・被依存を SQL で引く)。
//   位置は node の番号でなく sourceKey で持つ (node.source_key と突き合わせられる)
// - node・span・unit_file は単位を整数の番号 (unit.id) で引く (64 文字の key を行ごとに持たない)。
//   node・span は WITHOUT ROWID (主キーの木 1 つにする)
// - 保存 (begin → 書く → commit) は 1 つのトランザクション。途中で止まれば前の目録が残る
// - 解析結果の書き込みは SAVEPOINT (保存のトランザクションの中でも外でも使える)
// - 置き場所の版 (SAVE_FORMAT_VERSION) が違えば、表を作り直す (前の保存は捨てる。今までの版上げと同じ)

const SCHEMA = `
CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL) STRICT;
CREATE TABLE IF NOT EXISTS source (hash TEXT PRIMARY KEY, text TEXT NOT NULL) STRICT;
CREATE TABLE IF NOT EXISTS snapshot (name TEXT PRIMARY KEY, manifest TEXT NOT NULL) STRICT;
CREATE TABLE IF NOT EXISTS unit (
    id INTEGER PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL,
    format_version TEXT NOT NULL,
    root TEXT NOT NULL
) STRICT;
CREATE TABLE IF NOT EXISTS unit_file (
    unit_id INTEGER NOT NULL,
    path TEXT NOT NULL,
    hash TEXT NOT NULL,
    file_no INTEGER NOT NULL,
    PRIMARY KEY (unit_id, path)
) STRICT, WITHOUT ROWID;
CREATE TABLE IF NOT EXISTS node (
    unit_id INTEGER NOT NULL,
    node_id INTEGER NOT NULL,
    parent_id INTEGER,
    path TEXT NOT NULL,
    kind TEXT NOT NULL,
    object_key TEXT,
    source_key TEXT,
    content TEXT NOT NULL,
    span_entry INTEGER,
    span_position INTEGER,
    PRIMARY KEY (unit_id, node_id)
) STRICT, WITHOUT ROWID;
CREATE INDEX IF NOT EXISTS node_unit_kind ON node (kind, unit_id);
CREATE INDEX IF NOT EXISTS node_parent ON node (unit_id, parent_id);
CREATE TABLE IF NOT EXISTS span (
    unit_id INTEGER NOT NULL,
    entry INTEGER NOT NULL,
    position INTEGER NOT NULL,
    object_key TEXT NOT NULL,
    source_key TEXT NOT NULL,
    file_no INTEGER,
    context TEXT,
    start_offset INTEGER NOT NULL,
    start_line INTEGER NOT NULL,
    start_column INTEGER NOT NULL,
    end_offset INTEGER NOT NULL,
    end_line INTEGER NOT NULL,
    end_column INTEGER NOT NULL,
    position_file_path TEXT,
    PRIMARY KEY (unit_id, entry, position)
) STRICT, WITHOUT ROWID;
CREATE TABLE IF NOT EXISTS derived (
    unit_id INTEGER PRIMARY KEY,
    format_version TEXT NOT NULL,
    derived_version INTEGER NOT NULL,
    data BLOB NOT NULL
) STRICT;
CREATE TABLE IF NOT EXISTS symbol (
    unit_id INTEGER NOT NULL,
    seq INTEGER NOT NULL,
    kind TEXT NOT NULL,
    name TEXT NOT NULL,
    name_lc TEXT NOT NULL,
    source_key TEXT,
    PRIMARY KEY (unit_id, seq)
) STRICT, WITHOUT ROWID;
CREATE INDEX IF NOT EXISTS symbol_name ON symbol (name_lc, kind);
CREATE TABLE IF NOT EXISTS reference (
    unit_id INTEGER NOT NULL,
    seq INTEGER NOT NULL,
    target_type TEXT NOT NULL,
    target TEXT NOT NULL,
    target_lc TEXT NOT NULL,
    kind TEXT NOT NULL,
    via TEXT NOT NULL,
    member TEXT,
    statement_key TEXT,
    expression_key TEXT,
    resolution TEXT,
    PRIMARY KEY (unit_id, seq)
) STRICT, WITHOUT ROWID;
CREATE INDEX IF NOT EXISTS reference_target ON reference (target_type, target_lc);
CREATE TABLE IF NOT EXISTS metric (
    unit_id INTEGER NOT NULL,
    seq INTEGER NOT NULL,
    body TEXT NOT NULL,
    source_key TEXT,
    name TEXT NOT NULL,
    value REAL NOT NULL,
    PRIMARY KEY (unit_id, seq, name)
) STRICT, WITHOUT ROWID;
CREATE INDEX IF NOT EXISTS metric_name ON metric (name, value);
CREATE TABLE IF NOT EXISTS file_stat (
    path TEXT PRIMARY KEY,
    size INTEGER NOT NULL,
    mtime_ms REAL NOT NULL,
    hash TEXT NOT NULL,
    checked_at REAL NOT NULL
) STRICT;
`;

const TABLES = [
    'meta',
    'source',
    'snapshot',
    'unit',
    'unit_file',
    'node',
    'span',
    'derived',
    'symbol',
    'reference',
    'metric',
    'file_stat',
];

/** * を任意の文字列にした LIKE の形 (% _ \ はそのままの文字として扱う) */
const likePattern = (glob: string): string =>
    glob.replace(/[\\%_]/g, (c) => `\\${c}`).replace(/\*/g, '%');

/**
 * 定義・参照の JSON を圧縮する (同じ形の繰り返しが多く、NPSP で 66 MB あった)。
 * deflate (zlib) は速く、展開も軽い (起動し直したときに全単位を読む)
 */
const deflate = (text: string): Uint8Array => zlib.deflateRawSync(text, { level: 6 });
const inflate = (data: Uint8Array): string => zlib.inflateRawSync(data).toString('utf8');

/** 単位の番号で引く子の表 */
const CHILD_TABLES = ['unit_file', 'node', 'span', 'derived', 'symbol', 'reference', 'metric'];

/** 前の版の置き場 (msgpack のファイル) の名前。開いたときに消す (移行しない) */
const LEGACY_ENTRIES = ['manifest.msgpack', 'stats.msgpack', 'parsed', 'sources', 'derived'];

export const DATABASE_FILE = 'metascope.db';

/** 開いているデータベース (closeAllStoreBackends で閉じる) */
const openBackends = new Set<SqliteStoreBackend>();

/** 開いているすべての置き場のデータベースを閉じる (テストで一時フォルダを消す前・プロセスを終える前) */
export const closeAllStoreBackends = (): void => {
    for (const backend of [...openBackends]) backend.close();
};

/** SQLite の行 (node:sqlite の結果。列の型は SQL で決まるので、読むところで列ごとに型を付ける) */
type Row = Record<string, unknown>;

export class SqliteStoreBackend implements StoreBackend {
    readonly db: DatabaseSync;
    private readonly statements = new Map<string, StatementSync>();
    private savepoint = 0;
    /** batch の入れ子の深さと、batch が始めたトランザクションが開いているか */
    private batchDepth = 0;
    private batchTransaction = false;

    /** dir は置き場 (<savingRoot>/store) */
    constructor(readonly dir: string) {
        fs.mkdirSync(dir, { recursive: true });
        for (const name of LEGACY_ENTRIES) {
            fs.rmSync(path.join(dir, name), { recursive: true, force: true });
        }
        this.db = new DatabaseSync(path.join(dir, DATABASE_FILE));
        openBackends.add(this);
        // busy_timeout: 書き込みのスレッド (storeWriter.ts) と同時に書こうとしたら待つ。journal_mode の切り替えも
        // ロックを取るので、先に busy_timeout を設定する (閉じたばかりの書き込みのスレッドがまだ握っていると、
        // 待たずに database is locked になる)
        this.db.exec(
            'PRAGMA busy_timeout = 60000; PRAGMA journal_mode = WAL; PRAGMA synchronous = NORMAL;',
        );
        this.db.exec(SCHEMA);
        const version = (
            this.db.prepare("SELECT value FROM meta WHERE key = 'layoutVersion'").get() as
                { value: string } | undefined
        )?.value;
        if (version !== String(SAVE_FORMAT_VERSION)) {
            // 版が違えば作り直す
            for (const table of TABLES) this.db.exec(`DROP TABLE IF EXISTS ${table}`);
            this.db.exec(SCHEMA);
            this.db
                .prepare("INSERT INTO meta (key, value) VALUES ('layoutVersion', ?)")
                .run(String(SAVE_FORMAT_VERSION));
        }
    }

    private statement(sql: string): StatementSync {
        let statement = this.statements.get(sql);
        if (!statement) {
            statement = this.db.prepare(sql);
            this.statements.set(sql, statement);
        }
        return statement;
    }

    /** SAVEPOINT で囲んで実行する (保存のトランザクションの中でも外でも使える) */
    private atomically<T>(fn: () => T): T {
        const name = `sp${++this.savepoint}`;
        this.db.exec(`SAVEPOINT ${name}`);
        try {
            const result = fn();
            this.db.exec(`RELEASE ${name}`);
            return result;
        } catch (error) {
            this.db.exec(`ROLLBACK TO ${name}; RELEASE ${name}`);
            throw error;
        }
    }

    /** 単位の番号 (今の版の解析結果があるときだけ) */
    private unitIdOf(type: string, key: string, formatVersion: string): number | undefined {
        return (
            this.statement(
                'SELECT id FROM unit WHERE key = ? AND type = ? AND format_version = ?',
            ).get(key, type, formatVersion) as { id: number } | undefined
        )?.id;
    }

    async readManifest(): Promise<Manifest | undefined> {
        const row = this.statement("SELECT manifest FROM snapshot WHERE name = 'before'").get() as
            { manifest: string } | undefined;
        if (!row) return undefined;
        const manifest = JSON.parse(row.manifest) as Partial<Manifest>;
        if (manifest.layoutVersion !== SAVE_FORMAT_VERSION || !Array.isArray(manifest.units)) {
            return undefined;
        }
        return manifest as Manifest;
    }

    async hasParsed(type: string, key: string, formatVersion: string): Promise<boolean> {
        return this.unitIdOf(type, key, formatVersion) !== undefined;
    }

    async readParsed(
        type: string,
        key: string,
        formatVersion: string,
    ): Promise<UnitParseResult | undefined> {
        const unit = this.statement(
            'SELECT id, root FROM unit WHERE key = ? AND type = ? AND format_version = ?',
        ).get(key, type, formatVersion) as { id: number; root: string } | undefined;
        if (!unit) return undefined;
        // 列に別名を付けて、読んだ行をそのまま使う (行ごとに詰め替えない。NPSP の 170 万行で約 2 秒かかっていた)
        const nodes = this.statement(
            `SELECT node_id AS nodeId, kind, object_key AS objectKey, source_key AS sourceKey,
                content FROM node WHERE unit_id = ?`,
        ).all(unit.id) as unknown as Parameters<typeof rebuildUnit>[1];
        const spans = this.statement(
            `SELECT entry, position, object_key AS objectKey, source_key AS sourceKey,
                file_no AS fileNo, context, start_offset AS startOffset, start_line AS startLine,
                start_column AS startColumn, end_offset AS endOffset, end_line AS endLine,
                end_column AS endColumn, position_file_path AS positionFilePath
            FROM span WHERE unit_id = ? ORDER BY entry, position`,
        ).all(unit.id) as unknown as (SpanRow & { fileNo: number | null })[];
        const texts = new Map(
            (
                this.statement(
                    'SELECT f.path AS path, f.file_no AS fileNo, s.text AS text FROM unit_file f JOIN source s ON s.hash = f.hash WHERE f.unit_id = ?',
                ).all(unit.id) as { path: string; fileNo: number; text: string }[]
            ).map((row) => [row.path, row.text]),
        );
        // span はファイルを番号で持つ (パスを行ごとに持たない)
        const paths = new Map(
            (
                this.statement(
                    'SELECT file_no AS fileNo, path FROM unit_file WHERE unit_id = ?',
                ).all(unit.id) as { fileNo: number; path: string }[]
            ).map((row) => [row.fileNo, row.path]),
        );
        for (const span of spans) {
            span.filePath = span.fileNo === null ? null : (paths.get(span.fileNo) ?? null);
        }
        try {
            return rebuildUnit(unit.root, nodes, spans, (file) =>
                texts.get(file),
            ) as UnitParseResult;
        } catch {
            // ソースが欠けて組み立てられなければ、ないものとして扱う (parse し直す)
            return undefined;
        }
    }

    async writeParsed(
        type: string,
        key: string,
        formatVersion: string,
        data: UnitParseResult,
        files: readonly UnitSourceFile[] = [],
    ): Promise<void> {
        const { root, nodes, spans } = flattenUnit(data, files);
        this.atomically(() => {
            const existing = this.statement('SELECT id FROM unit WHERE key = ?').get(key) as
                { id: number } | undefined;
            let unitId: number;
            if (existing) {
                unitId = existing.id;
                for (const table of CHILD_TABLES) {
                    this.statement(`DELETE FROM ${table} WHERE unit_id = ?`).run(unitId);
                }
                this.statement(
                    'UPDATE unit SET type = ?, format_version = ?, root = ? WHERE id = ?',
                ).run(type, formatVersion, root, unitId);
            } else {
                unitId = Number(
                    this.statement(
                        'INSERT INTO unit (key, type, format_version, root) VALUES (?, ?, ?, ?)',
                    ).run(key, type, formatVersion, root).lastInsertRowid,
                );
            }
            const fileNos = new Map<string, number>();
            files.forEach((file, fileNo) => {
                fileNos.set(file.path, fileNo);
                this.statement('INSERT OR IGNORE INTO source (hash, text) VALUES (?, ?)').run(
                    file.hash,
                    file.text,
                );
                this.statement(
                    'INSERT OR REPLACE INTO unit_file (unit_id, path, hash, file_no) VALUES (?, ?, ?, ?)',
                ).run(unitId, file.path, file.hash, fileNo);
            });
            const insertNode = this.statement(
                'INSERT INTO node (unit_id, node_id, parent_id, path, kind, object_key, source_key, content, span_entry, span_position) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            );
            for (const node of nodes) {
                insertNode.run(
                    unitId,
                    node.nodeId,
                    node.parentId,
                    node.path,
                    node.kind,
                    node.objectKey,
                    node.sourceKey,
                    node.content,
                    node.spanEntry,
                    node.spanPosition,
                );
            }
            const insertSpan = this.statement(
                'INSERT INTO span (unit_id, entry, position, object_key, source_key, file_no, context, start_offset, start_line, start_column, end_offset, end_line, end_column, position_file_path) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            );
            for (const span of spans) {
                insertSpan.run(
                    unitId,
                    span.entry,
                    span.position,
                    span.objectKey,
                    span.sourceKey,
                    span.filePath === null ? null : (fileNos.get(span.filePath) ?? null),
                    span.context,
                    span.startOffset,
                    span.startLine,
                    span.startColumn,
                    span.endOffset,
                    span.endLine,
                    span.endColumn,
                    span.positionFilePath,
                );
            }
        });
    }

    async readDerived(
        type: string,
        key: string,
        formatVersion: string,
        derivedVersion: number,
    ): Promise<UnitDependencies | undefined> {
        const unitId = this.unitIdOf(type, key, formatVersion);
        if (unitId === undefined) return undefined;
        const row = this.statement(
            'SELECT data FROM derived WHERE unit_id = ? AND format_version = ? AND derived_version = ?',
        ).get(unitId, formatVersion, derivedVersion) as { data: Uint8Array } | undefined;
        return row ? (JSON.parse(inflate(row.data)) as UnitDependencies) : undefined;
    }

    async writeDerived(
        type: string,
        key: string,
        formatVersion: string,
        derivedVersion: number,
        data: UnitDependencies,
    ): Promise<void> {
        // 定義・参照は解析結果の行に付ける (解析結果がなければ書かない)
        const unitId = this.unitIdOf(type, key, formatVersion);
        if (unitId === undefined) return;
        this.atomically(() => {
            this.statement(
                'INSERT OR REPLACE INTO derived (unit_id, format_version, derived_version, data) VALUES (?, ?, ?, ?)',
            ).run(unitId, formatVersion, derivedVersion, deflate(JSON.stringify(data)));
            this.statement('DELETE FROM symbol WHERE unit_id = ?').run(unitId);
            this.statement('DELETE FROM reference WHERE unit_id = ?').run(unitId);
            this.statement('DELETE FROM metric WHERE unit_id = ?').run(unitId);
            const metric = this.statement(
                'INSERT INTO metric (unit_id, seq, body, source_key, name, value) VALUES (?, ?, ?, ?, ?, ?)',
            );
            (data.metrics ?? []).forEach((body, seq) => {
                for (const [name, value] of Object.entries(body.values)) {
                    metric.run(unitId, seq, body.body, body.sourceKey ?? null, name, value);
                }
            });
            const symbol = this.statement(
                'INSERT INTO symbol (unit_id, seq, kind, name, name_lc, source_key) VALUES (?, ?, ?, ?, ?, ?)',
            );
            data.definitions.forEach((definition, seq) =>
                symbol.run(
                    unitId,
                    seq,
                    definition.defType,
                    definition.name,
                    definition.name.toLowerCase(),
                    definition.sourceKeys?.sourceKey ?? null,
                ),
            );
            const reference = this.statement(
                `INSERT INTO reference (unit_id, seq, target_type, target, target_lc, kind, via, member,
                    statement_key, expression_key, resolution) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            );
            data.references.forEach((ref, seq) =>
                reference.run(
                    unitId,
                    seq,
                    ref.refType,
                    ref.target,
                    ref.target.toLowerCase(),
                    ref.kind,
                    ref.via,
                    ref.from.member ?? null,
                    ref.from.statement?.sourceKey ?? null,
                    ref.from.expression?.sourceKey ?? null,
                    ref.resolution ?? 'byName',
                ),
            );
        });
    }

    async findReferences(query: ReferenceQuery): Promise<ReferenceHit[]> {
        const rows = this.statement(
            `SELECT u.key AS unit_key, u.type AS unit_type, r.target_type, r.target, r.kind, r.via,
                r.member, r.statement_key, r.expression_key, r.resolution
            FROM reference r JOIN unit u ON u.id = r.unit_id
            WHERE u.key IN (SELECT value FROM json_each(?1))
                AND r.target_type = ?2 AND r.target_lc = ?3
            ORDER BY u.key, r.seq`,
        ).all(
            JSON.stringify(query.unitKeys),
            query.targetType,
            query.target.toLowerCase(),
        ) as Row[];
        return rows.map((row) => ({
            unitKey: row.unit_key as string,
            unitType: row.unit_type as string,
            targetType: row.target_type as string,
            target: row.target as string,
            kind: row.kind as string,
            via: row.via as string,
            member: row.member as string | null,
            statementKey: row.statement_key as string | null,
            expressionKey: row.expression_key as string | null,
            resolution: row.resolution as ReferenceHit['resolution'],
        }));
    }

    async findMetrics(query: MetricQuery): Promise<MetricHit[]> {
        const rows = this.statement(
            `SELECT u.key AS unit_key, u.type AS unit_type, m.body, m.source_key, m.name, m.value
            FROM metric m JOIN unit u ON u.id = m.unit_id
            WHERE u.key IN (SELECT value FROM json_each(?1))
                AND m.name = ?2 AND (?3 IS NULL OR m.value >= ?3)
            ORDER BY m.value DESC, u.key, m.seq
            LIMIT ?4`,
        ).all(
            JSON.stringify(query.unitKeys),
            query.name,
            query.min ?? null,
            query.limit ?? -1,
        ) as Row[];
        return rows.map((row) => ({
            unitKey: row.unit_key as string,
            unitType: row.unit_type as string,
            body: row.body as string,
            sourceKey: row.source_key as string | null,
            name: row.name as string,
            value: row.value as number,
        }));
    }

    async findSymbols(query: SymbolQuery): Promise<SymbolHit[]> {
        const rows = this.statement(
            `SELECT u.key AS unit_key, u.type AS unit_type, s.kind, s.name, s.source_key
            FROM symbol s JOIN unit u ON u.id = s.unit_id
            WHERE u.key IN (SELECT value FROM json_each(?1))
                AND s.name_lc = ?2 AND (?3 IS NULL OR s.kind = ?3)
            ORDER BY u.key, s.seq`,
        ).all(
            JSON.stringify(query.unitKeys),
            query.name.toLowerCase(),
            query.kind ?? null,
        ) as Row[];
        return rows.map((row) => ({
            unitKey: row.unit_key as string,
            unitType: row.unit_type as string,
            kind: row.kind as string,
            name: row.name as string,
            sourceKey: row.source_key as string | null,
        }));
    }

    async readSource(hash: string): Promise<string | undefined> {
        return (
            this.statement('SELECT text FROM source WHERE hash = ?').get(hash) as
                { text: string } | undefined
        )?.text;
    }

    async hasSource(hash: string): Promise<boolean> {
        return this.statement('SELECT 1 FROM source WHERE hash = ?').get(hash) !== undefined;
    }

    async writeSource(hash: string, text: string): Promise<void> {
        this.statement('INSERT OR IGNORE INTO source (hash, text) VALUES (?, ?)').run(hash, text);
    }

    async batch<T>(fn: () => Promise<T>): Promise<T> {
        if (this.batchDepth === 0 && !this.db.isTransaction) {
            this.db.exec('BEGIN');
            this.batchTransaction = true;
        }
        this.batchDepth++;
        try {
            return await fn();
        } finally {
            this.batchDepth--;
            if (this.batchDepth === 0 && this.batchTransaction) {
                this.batchTransaction = false;
                if (this.db.isTransaction) this.db.exec('COMMIT');
            }
        }
    }

    async begin(): Promise<void> {
        // batch のトランザクションが開いていれば、先に確定する (保存は自分のトランザクションで行う)
        if (this.batchTransaction && this.db.isTransaction) this.db.exec('COMMIT');
        this.batchTransaction = false;
        this.db.exec('BEGIN IMMEDIATE');
    }

    async commit(manifest: Manifest): Promise<void> {
        this.statement("INSERT OR REPLACE INTO snapshot (name, manifest) VALUES ('before', ?)").run(
            JSON.stringify(manifest),
        );
        // 目録にない解析結果・定義・参照と、どの単位も使わないソースを消す
        this.db.exec(
            'CREATE TEMP TABLE IF NOT EXISTS keep (key TEXT PRIMARY KEY); DELETE FROM keep;',
        );
        const keep = this.statement('INSERT OR IGNORE INTO keep (key) VALUES (?)');
        for (const unit of manifest.units) keep.run(unit.key);
        this.db.exec('DELETE FROM unit WHERE key NOT IN (SELECT key FROM keep)');
        for (const table of CHILD_TABLES) {
            this.db.exec(`DELETE FROM ${table} WHERE unit_id NOT IN (SELECT id FROM unit)`);
        }
        const hashes = new Set(
            manifest.units.flatMap((unit) => unit.files.map((file) => file.hash)),
        );
        this.db.exec('DELETE FROM keep');
        for (const hash of hashes) keep.run(hash);
        this.db.exec(
            'DELETE FROM source WHERE hash NOT IN (SELECT key FROM keep) AND hash NOT IN (SELECT hash FROM unit_file)',
        );
        this.db.exec('COMMIT');
        // WAL をデータベースに書き戻して縮める (保存は時々なので、そのたびに行う)
        this.db.exec('PRAGMA wal_checkpoint(TRUNCATE)');
    }

    async rollback(): Promise<void> {
        if (this.db.isTransaction) this.db.exec('ROLLBACK');
    }

    async readFileStats(): Promise<Map<string, FileStatEntry>> {
        return new Map(
            (this.statement('SELECT * FROM file_stat').all() as Row[]).map((row) => [
                row.path as string,
                {
                    size: row.size as number,
                    mtimeMs: row.mtime_ms as number,
                    hash: row.hash as string,
                    checkedAt: row.checked_at as number,
                },
            ]),
        );
    }

    async writeFileStats(entries: [string, FileStatEntry][]): Promise<void> {
        this.atomically(() => {
            this.db.exec('DELETE FROM file_stat');
            const insert = this.statement(
                'INSERT INTO file_stat (path, size, mtime_ms, hash, checked_at) VALUES (?, ?, ?, ?, ?)',
            );
            for (const [file, entry] of entries) {
                insert.run(file, entry.size, entry.mtimeMs, entry.hash, entry.checkedAt);
            }
        });
    }

    async findNodes(query: NodeQuery): Promise<{ total: number; nodes: NodeHit[] }> {
        const where = `n.unit_id IN (SELECT id FROM unit WHERE key IN (SELECT value FROM json_each(?)))
            AND (?2 IS NULL OR n.kind LIKE ?2 ESCAPE '\\')
            AND (?3 IS NULL OR instr(n.object_key, ?3) > 0)`;
        const params = [
            JSON.stringify(query.unitKeys),
            query.kind === undefined ? null : likePattern(query.kind),
            query.objectKey ?? null,
        ];
        const total = (
            this.statement(`SELECT count(*) AS total FROM node n WHERE ${where}`).get(
                ...params,
            ) as { total: number }
        ).total;
        // 位置は、ノードの sourceKey の最初の位置 (保存するときに node.span_entry・span_position に入れた。主キーで引く)
        const rows = this.statement(
            `SELECT u.key AS unit_key, n.kind, n.object_key, n.path,
                COALESCE((SELECT f.path FROM unit_file f WHERE f.unit_id = s.unit_id AND f.file_no = s.file_no),
                    (SELECT min(f.path) FROM unit_file f WHERE f.unit_id = n.unit_id
                        AND (f.path = s.position_file_path OR f.path LIKE '%/' || s.position_file_path)),
                    (SELECT min(f.path) FROM unit_file f WHERE f.unit_id = n.unit_id)) AS file_path,
                s.start_line, s.end_line
            FROM node n
            JOIN unit u ON u.id = n.unit_id
            LEFT JOIN span s ON s.unit_id = n.unit_id
                AND s.entry = n.span_entry AND s.position = n.span_position
            WHERE ${where}
            ORDER BY u.key, file_path, s.start_offset, n.node_id
            LIMIT ?4 OFFSET ?5`,
        ).all(...params, query.limit, query.offset ?? 0) as Row[];
        return {
            total,
            nodes: rows.map((row) => ({
                unitKey: row.unit_key as string,
                kind: row.kind as string,
                objectKey: row.object_key as string | null,
                path: row.path as string,
                filePath: row.file_path as string | null,
                startLine: row.start_line as number | null,
                endLine: row.end_line as number | null,
            })),
        };
    }

    async countNodeKinds(unitKeys: readonly string[]): Promise<NodeKindCount[]> {
        return (
            this.statement(
                `SELECT u.type AS unit_type, n.kind AS kind, count(*) AS count
                FROM node n JOIN unit u ON u.id = n.unit_id
                WHERE u.key IN (SELECT value FROM json_each(?))
                GROUP BY u.type, n.kind
                ORDER BY count DESC, u.type, n.kind`,
            ).all(JSON.stringify(unitKeys)) as Row[]
        ).map((row) => ({
            unitType: row.unit_type as string,
            kind: row.kind as string,
            count: row.count as number,
        }));
    }

    close(): void {
        openBackends.delete(this);
        if (this.db.isOpen) this.db.close();
    }
}
