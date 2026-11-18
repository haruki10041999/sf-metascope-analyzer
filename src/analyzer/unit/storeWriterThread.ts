// StoreWriterThread が worker_threads で起動するエントリ (解析結果の DB への書き込み)
import { runStoreWriter } from './storeWriter';

runStoreWriter();
