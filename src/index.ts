interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * Abgeordnetenwatch MCP — German federal & state parliament data.
 *
 * Wraps the keyless Abgeordnetenwatch API v2 (CC0). Covers the Bundestag,
 * all 16 state Landtage and the EU parliament: find politicians by name,
 * get their party/bio, list parliaments and recorded votes/polls.
 *
 * API envelope is always { meta: { result: { count, total, ... } }, data: [...] }.
 * Pagination via range_start / range_end query params.
 */


const BASE = 'https://www.abgeordnetenwatch.de/api/v2';
const UA = 'pipeworx/1.0 (+https://pipeworx.io)';

interface Envelope<T> {
  meta?: { result?: { count?: number; total?: number } };
  data?: T;
}

const tools: McpToolExport['tools'] = [
  {
    name: 'list_parliaments',
    description:
      'List German parliaments tracked by Abgeordnetenwatch: the federal Bundestag, all 16 state Landtage, and the EU parliament. Returns id, short name and full official name for each. Use the ids to scope politician or poll queries.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'search_politicians',
    description:
      'Search German federal and state politicians by name (surname or partial surname, contains-match). Returns matching politicians with party, year of birth and sex. Example: name "Scholz" or "Merz". Use get_politician with a returned id for the full profile.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Surname or partial surname to search for (contains match), e.g. "Scholz".' },
        limit: { type: 'number', description: 'Max results to return (default 10).' },
      },
      required: ['name'],
    },
  },
  {
    name: 'get_politician',
    description:
      'Get the full profile of a single German politician by Abgeordnetenwatch id: name, party, year of birth, sex, education and residence. Get the id from search_politicians.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: ['number', 'string'], description: 'Abgeordnetenwatch politician id.' },
      },
      required: ['id'],
    },
  },
  {
    name: 'list_polls',
    description:
      'List recorded parliamentary votes/polls (Abstimmungen) with their title and date. Optionally scope to a single legislative period via period_id (a parliament-period id). Returns most recent polls first.',
    inputSchema: {
      type: 'object',
      properties: {
        period_id: { type: ['number', 'string'], description: 'Optional parliament-period (legislature) id to filter polls.' },
        limit: { type: 'number', description: 'Max results to return (default 10).' },
      },
    },
  },
];

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  try {
    switch (name) {
      case 'list_parliaments':
        return await listParliaments();
      case 'search_politicians':
        return await searchPoliticians(args);
      case 'get_politician':
        return await getPolitician(args);
      case 'list_polls':
        return await listPolls(args);
      default:
        return { error: `Unknown tool: ${name}` };
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

async function awGet<T>(path: string, notFoundStatuses: number[] = []): Promise<Envelope<T> | null> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Accept: 'application/json', 'User-Agent': UA },
  });
  if (!res.ok) {
    if (notFoundStatuses.includes(res.status)) return null;
    const body = await res.text().then((t) => t.slice(0, 200)).catch(() => '');
    throw new Error(`Abgeordnetenwatch: ${res.status} ${body}`);
  }
  return (await res.json()) as Envelope<T>;
}

interface Parliament {
  id: number;
  label?: string;
  label_external_long?: string;
}

async function listParliaments(): Promise<unknown> {
  const env = await awGet<Parliament[]>('/parliaments');
  const data = Array.isArray(env?.data) ? env!.data! : [];
  return {
    count: env?.meta?.result?.count ?? data.length,
    parliaments: data.map((p) => ({
      id: p.id,
      name: p.label,
      full_name: p.label_external_long,
    })),
  };
}

interface Politician {
  id: number;
  label?: string;
  first_name?: string;
  last_name?: string;
  party?: { id?: number; label?: string } | null;
  year_of_birth?: number;
  sex?: string;
  education?: string;
  residence?: string;
}

async function searchPoliticians(args: Record<string, unknown>): Promise<unknown> {
  const name = args.name;
  if (typeof name !== 'string' || !name.trim()) {
    return { error: 'Required argument "name" is missing. Pass a surname like "Scholz".' };
  }
  const limit = toLimit(args.limit, 10);
  // Verified filter form: last_name[cn]=<value> (contains-match, no entity prefix).
  const q = `last_name%5Bcn%5D=${encodeURIComponent(name.trim())}`;
  const env = await awGet<Politician[]>(`/politicians?${q}&range_end=${limit}`);
  const data = Array.isArray(env?.data) ? env!.data! : [];
  return {
    count: env?.meta?.result?.count ?? data.length,
    politicians: data.map((p) => ({
      id: p.id,
      name: p.label,
      party: p.party?.label,
      year_of_birth: p.year_of_birth,
      sex: p.sex,
    })),
  };
}

async function getPolitician(args: Record<string, unknown>): Promise<unknown> {
  const id = args.id;
  if (id === undefined || id === null || (typeof id !== 'number' && typeof id !== 'string') || String(id).trim() === '') {
    return { error: 'Required argument "id" is missing. Pass an Abgeordnetenwatch politician id.' };
  }
  const env = await awGet<Politician | Politician[]>(`/politicians/${encodeURIComponent(String(id))}`, [404, 500]);
  if (!env) {
    return { error: 'politician not found', id };
  }
  const raw = env.data;
  const p: Politician | undefined = Array.isArray(raw) ? raw[0] : (raw ?? undefined);
  if (!p || p.id === undefined) {
    return { error: 'politician not found', id };
  }
  return {
    id: p.id,
    name: p.label,
    first_name: p.first_name,
    last_name: p.last_name,
    party: p.party?.label,
    year_of_birth: p.year_of_birth,
    sex: p.sex,
    education: p.education,
    residence: p.residence,
  };
}

interface Poll {
  id: number;
  label?: string;
  field_poll_date?: string;
}

async function listPolls(args: Record<string, unknown>): Promise<unknown> {
  const limit = toLimit(args.limit, 10);
  let path = `/polls?range_end=${limit}`;
  const periodId = args.period_id;
  if (periodId !== undefined && periodId !== null && String(periodId).trim() !== '') {
    path += `&field_legislature=${encodeURIComponent(String(periodId))}`;
  }
  const env = await awGet<Poll[]>(path);
  const data = Array.isArray(env?.data) ? env!.data! : [];
  return {
    count: env?.meta?.result?.count ?? data.length,
    polls: data.map((p) => ({
      id: p.id,
      label: p.label,
      date: p.field_poll_date,
    })),
  };
}

function toLimit(v: unknown, dflt: number): number {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : NaN;
  if (!Number.isFinite(n) || n <= 0) return dflt;
  return Math.min(Math.floor(n), 1000);
}

export default { tools, callTool, meter: { credits: 1 } } satisfies McpToolExport;
