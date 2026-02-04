
import { HistoryManager } from '../history.js';

export interface Container {
  historyManager: HistoryManager;
}

class DIContainer implements Container {
  private _historyManager?: HistoryManager;
  private cwd: string;

  constructor(cwd: string = process.cwd()) {
    this.cwd = cwd;
  }

  get historyManager(): HistoryManager {
    if (!this._historyManager) {
      this._historyManager = new HistoryManager(this.cwd);
    }
    return this._historyManager;
  }

  /**
   * For testing purposes allow replacing instances
   */
  setHistoryManager(instance: HistoryManager) {
    this._historyManager = instance;
  }
}

// Singleton instance
let instance: DIContainer | undefined;

export function getContainer(cwd?: string): DIContainer {
  if (!instance) {
    instance = new DIContainer(cwd);
  }
  return instance;
}

export function resetContainer() {
  instance = undefined;
}
