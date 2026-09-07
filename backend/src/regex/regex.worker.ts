import { parentPort, workerData } from 'worker_threads';

interface RegexWorkerData {
  regex: string;
  inputs: string[];
}

try {
  const { regex, inputs } = workerData as RegexWorkerData;
  const expression = new RegExp(regex);
  parentPort?.postMessage({ ok: true, results: inputs.map((input) => expression.test(input)) });
} catch (error) {
  parentPort?.postMessage({ ok: false, error: String(error) });
}
