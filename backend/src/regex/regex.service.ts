import { BadRequestException, Injectable } from '@nestjs/common';
import { Worker } from 'worker_threads';

// Codice eseguito in un worker thread isolato: valuta la regex su una lista
// di input. Se la regex è catastrofica (ReDoS), il worker viene terminato dal
// watchdog nel thread principale.
const WORKER_CODE = `
const { parentPort, workerData } = require('worker_threads');
try {
  const re = new RegExp(workerData.regex);
  const results = workerData.inputs.map((s) => re.test(s));
  parentPort.postMessage({ ok: true, results });
} catch (e) {
  parentPort.postMessage({ ok: false, error: String((e && e.message) || e) });
}
`;

@Injectable()
export class RegexService {
  private static readonly TIMEOUT_MS = 500;

  /** Valida la sintassi della regex; lancia 400 se non è valida. */
  validateSyntax(regex: string): void {
    if (!regex || regex.trim() === '') {
      throw new BadRequestException('La regex non può essere vuota');
    }
    try {
      // La compilazione non è soggetta a ReDoS: il rischio è nella valutazione.
      // eslint-disable-next-line no-new
      new RegExp(regex);
    } catch {
      throw new BadRequestException('Espressione regolare non valida');
    }
  }

  /** Testa se la regex soddisfa l'input (con timeout anti-ReDoS). */
  async matchesSafely(regex: string, input: string): Promise<boolean> {
    const [result] = await this.matchesAll(regex, [input]);
    return result;
  }

  /**
   * Valuta la regex su più input in un worker thread con timeout complessivo.
   * @returns un array di booleani, uno per input.
   */
  matchesAll(regex: string, inputs: string[]): Promise<boolean[]> {
    return new Promise((resolve, reject) => {
      const worker = new Worker(WORKER_CODE, {
        eval: true,
        workerData: { regex, inputs },
      });

      const timer = setTimeout(() => {
        worker.terminate();
        reject(
          new BadRequestException(
            'Valutazione della regex troppo lenta (possibile ReDoS)',
          ),
        );
      }, RegexService.TIMEOUT_MS);

      worker.once('message', (msg: { ok: boolean; results?: boolean[]; error?: string }) => {
        clearTimeout(timer);
        worker.terminate();
        if (msg.ok && msg.results) {
          resolve(msg.results);
        } else {
          reject(new BadRequestException('Errore durante la valutazione della regex'));
        }
      });

      worker.once('error', () => {
        clearTimeout(timer);
        worker.terminate();
        reject(new BadRequestException('Errore durante la valutazione della regex'));
      });
    });
  }
}
