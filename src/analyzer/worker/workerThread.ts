// BatchWorker (ApexWorker / ObjectWorker) が worker_threads で起動するエントリ
import { WorkerTask, runWorkerTask } from './workerTask';
import { registerWorkerTask } from './workerPool';

registerWorkerTask((task: WorkerTask) => runWorkerTask(task));
