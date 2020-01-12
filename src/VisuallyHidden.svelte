<script>
  export let text;
</script>

<style>
  .visually-hidden {
    border: 0;
    clip: rect(0 0 0 0);
    height: 1px;
    margin: -1px;
    overflow: hidden;
    padding: 0;
    position: absolute;
    width: 1px;
    white-space: nowrap;
    word-wrap: normal;
  }
</style>

<span class="visually-hidden">{text}</span>
