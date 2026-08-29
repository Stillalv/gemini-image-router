<script lang="ts">
  import '../app.css';
  import { onNavigate } from '$app/navigation';

  interface Props {
    children: any;
  }
  let { children }: Props = $props();

  onNavigate((navigation) => {
    if (!document.startViewTransition) return;
    return new Promise((resolve) => {
      document.startViewTransition(async () => {
        resolve();
        await navigation.complete;
      });
    });
  });
</script>

<main class="h-screen w-screen overflow-hidden flex flex-col">
  {@render children()}
</main>
