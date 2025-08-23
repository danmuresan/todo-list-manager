import { Response } from 'express';

type SSEClient = Response;

const clientsByList: Map<string, Set<SSEClient>> = new Map();

export function subscribe(listId: string, res: SSEClient) {
  if (!clientsByList.has(listId)) {
    clientsByList.set(listId, new Set());
  }
  const set = clientsByList.get(listId)!;
  set.add(res);

  res.write(`: connected\n\n`);

  const ping = setInterval(() => {
    try {
      res.write(`event: ping\n`);
      res.write(`data: ${Date.now()}\n\n`);
    } catch {
      // ignore
    }
  }, 25000);

  res.on('close', () => {
    clearInterval(ping);
    set.delete(res);
    if (set.size === 0) {
      clientsByList.delete(listId);
    }
  });
}

export function broadcast(listId: string, event: string, payload?: unknown) {
  const set = clientsByList.get(listId);
  if (!set || set.size === 0) {
    return;
  }
  const data = JSON.stringify(payload ?? {});
  for (const res of set) {
    try {
      res.write(`event: ${event}\n`);
      res.write(`data: ${data}\n\n`);
    } catch {
      // ignore
    }
  }
}
