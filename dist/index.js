(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = global || self, factory(global.BasicTable = {}));
}(this, (function (exports) { 'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if (typeof $$scope.dirty === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_data(text, data) {
        data = '' + data;
        if (text.data !== data)
            text.data = data;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, value = ret) => {
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    /* src/VisuallyHidden.svelte generated by Svelte v3.16.7 */

    function add_css() {
    	var style = element("style");
    	style.id = "svelte-11yyy7r-style";
    	style.textContent = ".visually-hidden.svelte-11yyy7r{border:0;clip:rect(0 0 0 0);height:1px;margin:-1px;overflow:hidden;padding:0;position:absolute;width:1px;white-space:nowrap;word-wrap:normal}";
    	append(document.head, style);
    }

    function create_fragment(ctx) {
    	let span;
    	let t;

    	return {
    		c() {
    			span = element("span");
    			t = text(/*text*/ ctx[0]);
    			attr(span, "class", "visually-hidden svelte-11yyy7r");
    		},
    		m(target, anchor) {
    			insert(target, span, anchor);
    			append(span, t);
    		},
    		p(ctx, [dirty]) {
    			if (dirty & /*text*/ 1) set_data(t, /*text*/ ctx[0]);
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(span);
    		}
    	};
    }

    function instance($$self, $$props, $$invalidate) {
    	let { text } = $$props;

    	$$self.$set = $$props => {
    		if ("text" in $$props) $$invalidate(0, text = $$props.text);
    	};

    	return [text];
    }

    class VisuallyHidden extends SvelteComponent {
    	constructor(options) {
    		super();
    		if (!document.getElementById("svelte-11yyy7r-style")) add_css();
    		init(this, options, instance, create_fragment, safe_not_equal, { text: 0 });
    	}
    }

    /* src/IconOnlyButton.svelte generated by Svelte v3.16.7 */

    function add_css$1() {
    	var style = element("style");
    	style.id = "svelte-ohdtj7-style";
    	style.textContent = ".reset.svelte-ohdtj7{border:none;margin:0;padding:0;width:auto;overflow:visible;background:transparent;color:inherit;font:inherit;line-height:normal;-webkit-font-smoothing:inherit;-moz-osx-font-smoothing:inherit;-webkit-appearance:none}.btn{display:block;background:transparent;padding:1rem !important;outline:none;cursor:pointer}.btn svg{fill:#2761ae;pointer-events:none}.btn:hover svg{fill:black}.btn:focus svg{fill:red}";
    	append(document.head, style);
    }

    function create_fragment$1(ctx) {
    	let button;
    	let t;
    	let button_class_value;
    	let current;
    	let dispose;
    	const visuallyhidden = new VisuallyHidden({ props: { text: /*text*/ ctx[5] } });
    	const default_slot_template = /*$$slots*/ ctx[10].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[9], null);

    	return {
    		c() {
    			button = element("button");
    			create_component(visuallyhidden.$$.fragment);
    			t = space();
    			if (default_slot) default_slot.c();
    			attr(button, "id", /*id*/ ctx[2]);
    			attr(button, "style", /*style*/ ctx[3]);
    			attr(button, "name", /*name*/ ctx[1]);
    			attr(button, "type", /*type*/ ctx[4]);
    			attr(button, "class", button_class_value = "" + (null_to_empty(/*vhClass*/ ctx[6]) + " svelte-ohdtj7"));
    			dispose = listen(button, "click", /*onclick*/ ctx[0]);
    		},
    		m(target, anchor) {
    			insert(target, button, anchor);
    			mount_component(visuallyhidden, button, null);
    			append(button, t);

    			if (default_slot) {
    				default_slot.m(button, null);
    			}

    			current = true;
    		},
    		p(ctx, [dirty]) {
    			const visuallyhidden_changes = {};
    			if (dirty & /*text*/ 32) visuallyhidden_changes.text = /*text*/ ctx[5];
    			visuallyhidden.$set(visuallyhidden_changes);

    			if (default_slot && default_slot.p && dirty & /*$$scope*/ 512) {
    				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[9], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[9], dirty, null));
    			}

    			if (!current || dirty & /*id*/ 4) {
    				attr(button, "id", /*id*/ ctx[2]);
    			}

    			if (!current || dirty & /*style*/ 8) {
    				attr(button, "style", /*style*/ ctx[3]);
    			}

    			if (!current || dirty & /*name*/ 2) {
    				attr(button, "name", /*name*/ ctx[1]);
    			}

    			if (!current || dirty & /*type*/ 16) {
    				attr(button, "type", /*type*/ ctx[4]);
    			}

    			if (!current || dirty & /*vhClass*/ 64 && button_class_value !== (button_class_value = "" + (null_to_empty(/*vhClass*/ ctx[6]) + " svelte-ohdtj7"))) {
    				attr(button, "class", button_class_value);
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(visuallyhidden.$$.fragment, local);
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(visuallyhidden.$$.fragment, local);
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(button);
    			destroy_component(visuallyhidden);
    			if (default_slot) default_slot.d(detaching);
    			dispose();
    		}
    	};
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { onclick = () => {
    		
    	} } = $$props;

    	let { name } = $$props;
    	let { id } = $$props;
    	let { style } = $$props;
    	let { type = "button" } = $$props;
    	let { text } = $$props;
    	let { reset } = $$props;
    	let { className = null } = $$props;
    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$props => {
    		if ("onclick" in $$props) $$invalidate(0, onclick = $$props.onclick);
    		if ("name" in $$props) $$invalidate(1, name = $$props.name);
    		if ("id" in $$props) $$invalidate(2, id = $$props.id);
    		if ("style" in $$props) $$invalidate(3, style = $$props.style);
    		if ("type" in $$props) $$invalidate(4, type = $$props.type);
    		if ("text" in $$props) $$invalidate(5, text = $$props.text);
    		if ("reset" in $$props) $$invalidate(7, reset = $$props.reset);
    		if ("className" in $$props) $$invalidate(8, className = $$props.className);
    		if ("$$scope" in $$props) $$invalidate(9, $$scope = $$props.$$scope);
    	};

    	let vhClass;

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*className, reset*/ 384) {
    			 $$invalidate(6, vhClass = className
    			? reset ? `${reset} ${className}` : className
    			: `${reset} ${btn}`);
    		}
    	};

    	return [
    		onclick,
    		name,
    		id,
    		style,
    		type,
    		text,
    		vhClass,
    		reset,
    		className,
    		$$scope,
    		$$slots
    	];
    }

    class IconOnlyButton extends SvelteComponent {
    	constructor(options) {
    		super();
    		if (!document.getElementById("svelte-ohdtj7-style")) add_css$1();

    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {
    			onclick: 0,
    			name: 1,
    			id: 2,
    			style: 3,
    			type: 4,
    			text: 5,
    			reset: 7,
    			className: 8
    		});
    	}
    }

    exports.IconOnlyButton = IconOnlyButton;
    exports.VisuallyHidden = VisuallyHidden;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
