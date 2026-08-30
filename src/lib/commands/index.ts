import { Sparkles, Layers, Ratio, Cpu } from 'lucide-svelte';

export interface SlashCommand {
  id: string;
  name: string;               // e.g. '/batch'
  label: string;              // e.g. 'Batch Edit'
  description: string;        // Deskripsi fungsi
  iconName: 'sparkles' | 'layers' | 'ratio' | 'cpu';
  allowInGenerate: boolean;   // true: tampil saat mode Text-to-Image (0 lampiran)
  allowInEdit: boolean;       // true: tampil saat mode Image-to-Image (ada lampiran)
  requiresAttachment?: boolean;
  example: string;
  badge?: string;
}

export const SLASH_COMMANDS: SlashCommand[] = [
  {
    id: 'multi',
    name: '/multi',
    label: 'Multi Variations',
    description: 'Hasilkan 2–4 variasi gambar berbeda secara paralel',
    iconName: 'sparkles',
    allowInGenerate: true,
    allowInEdit: true,
    badge: 'Multi',
    example: '/multi 4 kucing astronot di bulan'
  },
  {
    id: 'batch',
    name: '/batch',
    label: 'Batch Edit',
    description: 'Edit setiap gambar terlampir satu per satu secara mandiri',
    iconName: 'layers',
    allowInGenerate: false,
    allowInEdit: true,
    requiresAttachment: true,
    badge: 'Batch',
    example: '/batch ubah latar belakang jadi studio putih'
  },
  {
    id: 'ratio',
    name: '/ratio',
    label: 'Aspect Ratio',
    description: 'Set rasio aspek: 1:1, 16:9, 9:16, 4:3, 3:4, 2:1, 1:2',
    iconName: 'ratio',
    allowInGenerate: true,
    allowInEdit: true,
    example: '/ratio 16:9'
  },
  {
    id: 'model',
    name: '/model',
    label: 'AI Model',
    description: 'Pilih model: 3.7-flash, 3.5-flash-lite, 3.1-pro, extended-thinking',
    iconName: 'cpu',
    allowInGenerate: true,
    allowInEdit: true,
    example: '/model 3.7-flash'
  }
];

export interface ParsedCommandResult {
  rawCommand: string | null;
  commandId: string | null;
  count?: number;
  param?: string;
  cleanPrompt: string;
}

/**
 * Parses user input for slash commands.
 * Examples:
 * - "/multi 4 a cat in space" -> { commandId: 'multi', count: 4, cleanPrompt: 'a cat in space' }
 * - "/batch edit background" -> { commandId: 'batch', cleanPrompt: 'edit background' }
 * - "/ratio 16:9 anime scenery" -> { commandId: 'ratio', param: '16:9', cleanPrompt: 'anime scenery' }
 * - "/model pro futuristic robot" -> { commandId: 'model', param: 'pro', cleanPrompt: 'futuristic robot' }
 * - "just a regular prompt" -> { rawCommand: null, commandId: null, cleanPrompt: 'just a regular prompt' }
 */
export function parseSlashCommand(input: string): ParsedCommandResult {
  const trimmed = input.trim();
  if (!trimmed.startsWith('/')) {
    return {
      rawCommand: null,
      commandId: null,
      cleanPrompt: trimmed
    };
  }

  // Regex matches: /([a-zA-Z0-9_-]+)(?:\s+(\d+|[a-zA-Z0-9_.:-]+))?(?:\s+(.*))?$/
  const match = trimmed.match(/^\/([a-zA-Z0-9_-]+)(?:\s+(\d+|[a-zA-Z0-9_.:-]+))?(?:\s+(.*))?$/s);
  if (!match) {
    return {
      rawCommand: null,
      commandId: null,
      cleanPrompt: trimmed
    };
  }

  const [, rawCmdName, firstArg, restPrompt] = match;
  const cmdLower = rawCmdName.toLowerCase();
  const found = SLASH_COMMANDS.find(c => c.name.toLowerCase() === `/${cmdLower}` || c.id.toLowerCase() === cmdLower);

  if (!found) {
    return {
      rawCommand: `/${rawCmdName}`,
      commandId: null,
      cleanPrompt: trimmed
    };
  }

  let count: number | undefined = undefined;
  let param: string | undefined = undefined;
  let cleanPrompt = restPrompt ? restPrompt.trim() : '';

  if (found.id === 'multi') {
    // Check if firstArg is a number between 1 and 4
    if (firstArg && /^[1-4]$/.test(firstArg)) {
      count = parseInt(firstArg, 10);
    } else if (firstArg) {
      // firstArg is part of the prompt
      cleanPrompt = `${firstArg} ${cleanPrompt}`.trim();
      count = 4; // default count for /multi
    } else {
      count = 4;
    }
  } else if (found.id === 'ratio') {
    if (firstArg) {
      param = firstArg;
    }
  } else if (found.id === 'model') {
    if (firstArg) {
      param = firstArg;
    }
  } else if (firstArg) {
    // For other commands like /batch, firstArg is part of the prompt
    cleanPrompt = `${firstArg} ${cleanPrompt}`.trim();
  }

  return {
    rawCommand: `/${found.id}`,
    commandId: found.id,
    count,
    param,
    cleanPrompt
  };
}

/**
 * Returns available commands filtered by mode (isEditMode) and search query.
 */
export function getAvailableCommands(isEditMode: boolean, query = ''): SlashCommand[] {
  const cleanQuery = query.startsWith('/') ? query.slice(1).toLowerCase().trim() : query.toLowerCase().trim();

  return SLASH_COMMANDS.filter(cmd => {
    const isAllowed = isEditMode ? cmd.allowInEdit : cmd.allowInGenerate;
    if (!isAllowed) return false;
    if (!cleanQuery) return true;

    return (
      cmd.name.toLowerCase().includes(cleanQuery) ||
      cmd.id.toLowerCase().includes(cleanQuery) ||
      cmd.label.toLowerCase().includes(cleanQuery) ||
      cmd.description.toLowerCase().includes(cleanQuery)
    );
  });
}
