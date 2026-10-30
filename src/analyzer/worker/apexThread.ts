// ApexWorker が worker_threads で起動するエントリ
import { ApexTask, runApexTask } from './apexTask';
import { registerWorkerTask } from './workerPool';

registerWorkerTask((task: ApexTask) => runApexTask(task));
