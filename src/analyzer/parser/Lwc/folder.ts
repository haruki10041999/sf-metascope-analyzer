// LWC のバンドルのフォルダの読み込み (docs/lwc-parse-plan.md 4.1・4.2)。
// 1 バンドル = 1 つの解析の単位なので、フォルダを 1 回だけ読み、ファイルを種類ごとに分けて中身も読む。
// 解析 (bundle.ts) はここで読んだものだけを入力にし、ファイルシステムには触らない
import fs from 'node:fs/promises';
import path from 'node:path';

import { readSource } from '../commons';

/** バンドルの中の、解析するファイルの種類 */
export type LwcBundleFileType = 'module' | 'template' | 'stylesheet' | 'meta';

export type LwcBundleFile = {
    fileType: LwcBundleFileType;
    /** ファイル名 (hello.ts) */
    fileName: string;
    /** バンドルのフォルダの親からの相対パス (hello/hello.ts)。ソース位置・resolvedError の filePath になる */
    filePath: string;
    /** ソース (改行は LF にそろえたもの) */
    source: string;
};

/** 解析しないファイル・フォルダ */
export type LwcSkippedFile = {
    /** バンドルのフォルダの親からの相対パス (フォルダは末尾に /) */
    filePath: string;
    reason: string;
};

export type LwcBundleFolder = {
    /** バンドル名 (= フォルダ名) */
    name: string;
    /** バンドルのフォルダ (渡されたパスのまま) */
    bundleDir: string;
    /** 解析するファイル。種類ごとにファイル名の順 */
    files: LwcBundleFile[];
    skippedFiles: LwcSkippedFile[];
};

export const LWC_META_SUFFIX = '.js-meta.xml';

const SCRIPT_EXTENSIONS = ['.js', '.ts'];
const FILE_TYPE_ORDER: LwcBundleFileType[] = ['module', 'template', 'stylesheet', 'meta'];

/** ファイルの種類。解析しないものは理由 */
const classify = (
    fileName: string,
    bundleName: string,
    tsStems: ReadonlySet<string>,
): LwcBundleFileType | { reason: string } => {
    const lower = fileName.toLowerCase();
    if (lower.endsWith(LWC_META_SUFFIX)) {
        return lower === `${bundleName.toLowerCase()}${LWC_META_SUFFIX}`
            ? 'meta'
            : { reason: 'not the bundle metadata' };
    }
    const extension = path.extname(lower);
    if (SCRIPT_EXTENSIONS.includes(extension)) {
        if (/\.test\.[jt]s$/.test(lower)) return { reason: 'test file' };
        if (lower.endsWith('.d.ts')) return { reason: 'type declaration' };
        // 同じ名前の .ts と .js があれば .ts を読む (.js は .ts をコンパイルしたもの)
        if (extension === '.js' && tsStems.has(fileName.slice(0, -3))) {
            return { reason: `compiled from ${fileName.slice(0, -3)}.ts` };
        }
        return 'module';
    }
    if (extension === '.html') return 'template';
    if (extension === '.css') return 'stylesheet';
    return { reason: 'not analyzed' };
};

/**
 * バンドルのフォルダを読む。直下のファイルだけを見て、フォルダ (__tests__/ など) は skippedFiles にする。
 * フォルダが読めなければ例外
 */
export const readLwcBundleFolder = async (bundleDir: string): Promise<LwcBundleFolder> => {
    const name = path.basename(bundleDir);
    const entries = (await fs.readdir(bundleDir, { withFileTypes: true })).sort((a, b) =>
        a.name.localeCompare(b.name),
    );
    const tsStems = new Set(
        entries
            .filter((e) => e.isFile() && path.extname(e.name).toLowerCase() === '.ts')
            .map((e) => e.name.slice(0, -3)),
    );

    const files: LwcBundleFile[] = [];
    const skippedFiles: LwcSkippedFile[] = [];
    for (const entry of entries) {
        const filePath = `${name}/${entry.name}`;
        if (entry.isDirectory()) {
            skippedFiles.push({ filePath: `${filePath}/`, reason: 'folder' });
            continue;
        }
        if (!entry.isFile()) continue;
        const fileType = classify(entry.name, name, tsStems);
        if (typeof fileType === 'object') {
            skippedFiles.push({ filePath, reason: fileType.reason });
            continue;
        }
        files.push({
            fileType,
            fileName: entry.name,
            filePath,
            source: await readSource(path.join(bundleDir, entry.name)),
        });
    }

    files.sort(
        (a, b) =>
            FILE_TYPE_ORDER.indexOf(a.fileType) - FILE_TYPE_ORDER.indexOf(b.fileType) ||
            a.fileName.localeCompare(b.fileName),
    );
    return { name, bundleDir, files, skippedFiles };
};
