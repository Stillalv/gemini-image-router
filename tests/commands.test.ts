import { describe, it, expect } from 'bun:test';
import { parseSlashCommand, getAvailableCommands, SLASH_COMMANDS } from '../src/lib/commands';

describe('Slash Command System & Parser', () => {
  describe('parseSlashCommand', () => {
    it('should return null command for normal prompts without slash', () => {
      const result = parseSlashCommand('kucing lucu main bola');
      expect(result.commandId).toBeNull();
      expect(result.cleanPrompt).toBe('kucing lucu main bola');
    });

    it('should parse /multi with explicit count 4', () => {
      const result = parseSlashCommand('/multi 4 seekor harimau salju di puncak gunung');
      expect(result.commandId).toBe('multi');
      expect(result.count).toBe(4);
      expect(result.cleanPrompt).toBe('seekor harimau salju di puncak gunung');
    });

    it('should parse /multi with default count 4 when count is omitted', () => {
      const result = parseSlashCommand('/multi seekor harimau salju');
      expect(result.commandId).toBe('multi');
      expect(result.count).toBe(4);
      expect(result.cleanPrompt).toBe('seekor harimau salju');
    });

    it('should parse /batch command cleanly extracting the prompt', () => {
      const result = parseSlashCommand('/batch ubah warna mobil ini jadi merah');
      expect(result.commandId).toBe('batch');
      expect(result.cleanPrompt).toBe('ubah warna mobil ini jadi merah');
    });

    it('should parse /ratio command extracting the ratio argument', () => {
      const result = parseSlashCommand('/ratio 16:9 pemandangan alam');
      expect(result.commandId).toBe('ratio');
      expect(result.param).toBe('16:9');
      expect(result.cleanPrompt).toBe('pemandangan alam');
    });

    it('should parse /model command extracting the model argument', () => {
      const result = parseSlashCommand('/model 3.7-flash robot mecha');
      expect(result.commandId).toBe('model');
      expect(result.param).toBe('3.7-flash');
      expect(result.cleanPrompt).toBe('robot mecha');
    });

    it('should handle unrecognized commands gracefully without crash', () => {
      const result = parseSlashCommand('/unknowncommand some prompt');
      expect(result.commandId).toBeNull();
      expect(result.rawCommand).toBe('/unknowncommand');
      expect(result.cleanPrompt).toBe('/unknowncommand some prompt');
    });
  });

  describe('getAvailableCommands (Mode Filtering)', () => {
    it('should hide /batch when hasAttachments is false (Generate mode)', () => {
      const available = getAvailableCommands(false);
      const batchCmd = available.find(c => c.id === 'batch');
      const multiCmd = available.find(c => c.id === 'multi');
      const ratioCmd = available.find(c => c.id === 'ratio');

      expect(batchCmd).toBeUndefined();
      expect(multiCmd).toBeDefined();
      expect(ratioCmd).toBeDefined();
    });

    it('should show /batch when hasAttachments is true (Edit mode)', () => {
      const available = getAvailableCommands(true);
      const batchCmd = available.find(c => c.id === 'batch');
      const multiCmd = available.find(c => c.id === 'multi');

      expect(batchCmd).toBeDefined();
      expect(multiCmd).toBeDefined();
    });

    it('should filter commands by search query', () => {
      const filtered = getAvailableCommands(true, 'bat');
      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe('batch');
    });

    it('should filter commands when query starts with slash', () => {
      const filtered = getAvailableCommands(false, '/mul');
      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe('multi');
    });
  });
});
