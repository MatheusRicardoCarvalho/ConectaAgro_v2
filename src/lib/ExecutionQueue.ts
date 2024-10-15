interface QueueItem {
    fn: () => Promise<void>;
    resolve: (value: void | PromiseLike<void>) => void;
    reject: (reason?: any) => void;
}

export class ExecutionQueue {
    private queues: { [key: string]: QueueItem[] } = {};
    private running: { [key: string]: boolean } = {};

    async enqueue(threadId: string, fn: () => Promise<void>): Promise<void> {
        if (!this.queues[threadId]) {
            this.queues[threadId] = [];
            this.running[threadId] = false;
        }

        return new Promise((resolve, reject) => {
            this.queues[threadId].push({ fn, resolve, reject });
            if (!this.running[threadId]) {
                this.dequeue(threadId);
            }
        });
    }

    private async dequeue(threadId: string) {
        if (this.queues[threadId].length === 0) {
            this.running[threadId] = false;
            return;
        }

        this.running[threadId] = true;
        const { fn, resolve, reject } = this.queues[threadId].shift()!;
        try {
            await fn();
            resolve();
        } catch (error) {
            reject(error);
        } finally {
            this.dequeue(threadId);
        }
    }
}