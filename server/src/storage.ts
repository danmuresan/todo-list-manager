import fs from 'fs';
import path from 'path';

export type User = { id: string; username: string; token: string };
export type List = { id: string; name: string; key: string; members: string[] };
export type Todo = {
  id: string;
  listId: string;
  title: string;
  state: 'TODO' | 'ONGOING' | 'DONE';
  createdBy: string;
  updatedAt: string;
};

export type DB = {
  users: User[];
  lists: List[];
  todos: Todo[];
};

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'src', 'data');
const DB_PATH = path.join(DATA_DIR, 'db.json');

export const initialData: DB = {
  users: [],
  lists: [],
  todos: [],
};

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readDB(): DB {
  ensureDir(DATA_DIR);
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2));
    return { ...initialData };
  }
  const content = fs.readFileSync(DB_PATH, 'utf-8');
  try {
    return JSON.parse(content || '{}') as DB;
  } catch {
    return { ...initialData };
  }
}

function writeDB(data: DB) {
  ensureDir(DATA_DIR);
  const tmp = DB_PATH + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, DB_PATH);
}

export function getDB(): DB {
  return readDB();
}

export function saveDB(mutator: (data: DB) => DB | void): DB {
  const data = readDB();
  const newData = (mutator(data) as DB) || data;
  writeDB(newData);
  return newData;
}

export function resetDB() {
  writeDB({ ...initialData });
}
