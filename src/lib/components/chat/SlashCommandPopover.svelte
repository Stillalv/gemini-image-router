<script lang="ts">
  import { Sparkles, Layers, Ratio, Cpu } from 'lucide-svelte';
  import { fly } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import type { SlashCommand } from '$lib/commands';

  interface Props {
    commands: SlashCommand[];
    selectedIndex: number;
    onSelect: (command: SlashCommand) => void;
  }

  let { commands = [], selectedIndex = 0, onSelect }: Props = $props();

  function getIcon(name: string) {
    switch (name) {
      case 'sparkles': return Sparkles;
      case 'layers': return Layers;
      case 'ratio': return Ratio;
      case 'cpu': return Cpu;
      default: return Sparkles;
    }
  }
</script>

{#if commands.length > 0}
  <div
    in:fly={{ y: 8, duration: 150, easing: cubicOut }}
    class="absolute bottom-full left-0 mb-2 w-80 bg-white dark:bg-[#1c1c1f] border border-neutral-200 dark:border-[#2b2b2f] rounded-2xl shadow-2xl overflow-hidden z-50 divide-y divide-neutral-100 dark:divide-[#26262a]"
  >
    <div class="px-3.5 py-2 bg-neutral-50/90 dark:bg-[#161618]/90 flex items-center justify-between">
      <span class="text-[10.5px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
        Slash Commands
      </span>
      <span class="text-[10px] text-neutral-400">
        ↑↓ Navigasi • Enter Pilih
      </span>
    </div>

    <div class="p-1.5 max-h-56 overflow-y-auto space-y-0.5">
      {#each commands as cmd, idx}
        {@const Icon = getIcon(cmd.iconName)}
        <button
          type="button"
          onmousedown={(e) => { e.preventDefault(); onSelect(cmd); }}
          class="w-full text-left px-3 py-2 rounded-xl text-xs flex items-start gap-2.5 transition-all cursor-pointer {idx === selectedIndex ? 'bg-amber-500/10 dark:bg-amber-500/15 text-neutral-900 dark:text-white font-medium ring-1 ring-amber-500/30' : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800/60'}"
        >
          <div class="p-1.5 rounded-lg bg-neutral-100 dark:bg-[#252528] text-neutral-700 dark:text-neutral-200 flex-shrink-0 mt-0.5">
            <Icon class="w-3.5 h-3.5" />
          </div>

          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-1.5">
              <span class="font-mono font-bold text-amber-600 dark:text-amber-400">{cmd.name}</span>
              <span class="text-neutral-800 dark:text-neutral-200 font-semibold">{cmd.label}</span>
              {#if cmd.badge}
                <span class="ml-auto px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-neutral-200/70 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                  {cmd.badge}
                </span>
              {/if}
            </div>
            <p class="text-[11px] text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
              {cmd.description}
            </p>
          </div>
        </button>
      {/each}
    </div>
  </div>
{/if}
