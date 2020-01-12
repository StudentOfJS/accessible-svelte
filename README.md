# accessible-svelte

Accessible components for Svelte.

- light weight
- no default styling

## Starting 🚀

\_ You will need svelte and npm to use this package. Get started by downloading [svelte](http://svelte.dev)

### Installation 🔧

_To install using yarn_

`yarn add accessible-svelte`

_or npm_

`npm i accessible-svelte`

## Components

### Visually Hidden

_provides context to screen readers while being visually hidden, this is especially important when using icons without accompanying text_

```
<button>
  <VisuallyHidden text="close" />
  <svg
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden
    width="15.161"
    height="15.159"
    viewBox="0 0 15.161 15.159">
    <path
      d="M129.465,198.165l-4.247-4.249,4.247-4.247a1.954,1.954,0,0,0,0-2.761,2,2,0,0,0-2.76,0l-4.249,4.247-4.247-4.247a1.952,1.952,0,1,0-2.761,2.761l4.247,4.247-4.247,4.249a1.948,1.948,0,0,0,0,2.76,2,2,0,0,0,2.761,0l4.247-4.247,4.248,4.247a1.952,1.952,0,1,0,2.761-2.76Z"
      transform="translate(-114.876 -186.337)" />
  </svg>
</button>

```

### IconOnlyButton

_Add the aria-hidden to your svg or alt="" to an img and add your pass your text to the component_

```

<IconOnlyButton text="close" reset onclick={e => console.log(e)}>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden
    width="15.161"
    height="15.159"
    viewBox="0 0 15.161 15.159">
    <path
      d="M129.465,198.165l-4.247-4.249,4.247-4.247a1.954,1.954,0,0,0,0-2.761,2,2,0,0,0-2.76,0l-4.249,4.247-4.247-4.247a1.952,1.952,0,1,0-2.761,2.761l4.247,4.247-4.247,4.249a1.948,1.948,0,0,0,0,2.76,2,2,0,0,0,2.761,0l4.247-4.247,4.248,4.247a1.952,1.952,0,1,0,2.761-2.76Z"
      transform="translate(-114.876 -186.337)" />
  </svg>
</IconOnlyButton>
```

_in progress_

- modal

## Options 🛠️

### Visually Hidden

- text = _default = ''_

### IconOnlyButton

- onclick
- name
- id
- style
- type = _default = 'button'_
- text _this is the visually hidden text that describes what your button does_
- reset = _if true, this will add a button reset class to the button_
- className _ by default button reset and transparent button class are added_

## Versioned 📌

We use [SemVer](http://semver.org/) for versioning.

## Authors ✒️

- ** Rod Lewis ** - _Initial Work_ - [StudentOfJS](https://github.com/StudentOfJS)

## License 📄

[MIT](LICENSE)

## Expressions of Gratitude 🎁

_over 1 billion animals are estimated to have died in the recent and ongoing bushfires in Australia. Many more are displaced and face an uncertain future, even extinction in some cases. If accessible-svelte made your day a little easier and you want to thank me, please consider helping out_

- [RSPCA Australia](https://www.rspca.org.au/blog/2020/how-help-animals-during-bushfire-crisis)

---

⌨️ with ❤️ by [StudentOfJS](https://github.com/StudentOfJS) 😊
