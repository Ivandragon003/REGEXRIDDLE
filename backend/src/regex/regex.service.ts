import { BadRequestException, Injectable } from '@nestjs/common';
import { Worker } from 'worker_threads';
import { join } from 'path';

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
      const worker = new Worker(join(__dirname, 'regex.worker.js'), {
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
