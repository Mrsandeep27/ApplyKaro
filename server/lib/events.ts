import type { Response } from 'express';

export interface ApplyEvent {
  type:
    | 'queued'
    | 'portal_start'
    | 'apply_start'
    | 'opened'
    | 'form_detected'
    | 'filled'
    | 'submitted'
    | 'success'
    | 'skipped'
    | 'captcha'
    | 'rate_limited'
    | 'error'
    | 'done'
    | 'ping';
  job_id?: string;
  job_url?: string;
  job_title?: string;
  portal?: string;
  message?: string;
  screenshot?: string;
  at: string;
}

class EventBus {
  private subscribers = new Set<Response>();

  subscribe(res: Response) {
    this.subscribers.add(res);
    res.on('close', () => this.subscribers.delete(res));
  }

  emit(event: Omit<ApplyEvent, 'at'> | ApplyEvent) {
    const payload: ApplyEvent = {
      ...('at' in event ? event : { ...event, at: new Date().toISOString() }),
    };
    const line = `data: ${JSON.stringify(payload)}\n\n`;
    for (const r of this.subscribers) {
      try {
        r.write(line);
      } catch {
        this.subscribers.delete(r);
      }
    }
  }

  size() {
    return this.subscribers.size;
  }
}

export const bus = new EventBus();
