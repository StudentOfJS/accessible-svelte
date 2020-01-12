<script>
  import VisuallyHidden from "./VisuallyHidden.svelte";
  import { onMount } from "svelte";
  export let onclick = () => {};
  export let name;
  export let id;
  export let style;
  export let type = "button";
  export let text;
  export let reset;
  export let className = null;
  $: vhClass = className
    ? reset
      ? `${reset} ${className}`
      : className
    : `${reset} ${btn}`;
</script>

<style>
  .reset {
    border: none;
    margin: 0;
    padding: 0;
    width: auto;
    overflow: visible;
    background: transparent;
    color: inherit;
    font: inherit;
    line-height: normal;
    -webkit-font-smoothing: inherit;
    -moz-osx-font-smoothing: inherit;
    -webkit-appearance: none;
  }

  :global(.btn) {
    display: block;
    background: transparent;
    padding: 1rem !important;
    outline: none;
    cursor: pointer;
  }

  :global(.btn) svg {
    fill: #2761ae;
    pointer-events: none;
  }

  :global(.btn):hover svg {
    fill: black;
  }
  :global(.btn):focus svg {
    fill: red;
  }
</style>

<button {id} {style} {name} {type} on:click={onclick} class={vhClass}>
  <VisuallyHidden {text} />
  <slot />
</button>
