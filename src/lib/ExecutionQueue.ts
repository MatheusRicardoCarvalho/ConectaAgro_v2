interface QueueItem {
    fn: () => Promise<void>;
    resolve: (value: void | PromiseLike<void>) => void;
    reject: (reason?: any) => void;
  }
  
export  class ExecutionQueue {
    private queue: QueueItem[] = [];
    private running: boolean = false;
  
    async enqueue(fn: () => Promise<void>): Promise<void> {
      return new Promise((resolve, reject) => {
        this.queue.push({ fn, resolve, reject });
        if (!this.running) {
          this.dequeue();
        }
      });
    }
  
    private async dequeue() {
      if (this.queue.length === 0) {
        this.running = false;
        return;
      }
  
      this.running = true;
      const { fn, resolve, reject } = this.queue.shift()!;
      try {
        await fn();
        resolve();
      } catch (error) {
        reject(error);
      } finally {
        this.dequeue();
      }
    }
  }