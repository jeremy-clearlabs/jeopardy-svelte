
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
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
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
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
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
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
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    const active_docs = new Set();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        const doc = node.ownerDocument;
        active_docs.add(doc);
        const stylesheet = doc.__svelte_stylesheet || (doc.__svelte_stylesheet = doc.head.appendChild(element('style')).sheet);
        const current_rules = doc.__svelte_rules || (doc.__svelte_rules = {});
        if (!current_rules[name]) {
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ''}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            active_docs.forEach(doc => {
                const stylesheet = doc.__svelte_stylesheet;
                let i = stylesheet.cssRules.length;
                while (i--)
                    stylesheet.deleteRule(i);
                doc.__svelte_rules = {};
            });
            active_docs.clear();
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function afterUpdate(fn) {
        get_current_component().$$.after_update.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
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
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
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

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
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
    const null_transition = { duration: 0 };
    function create_in_transition(node, fn, params) {
        let config = fn(node, params);
        let running = false;
        let animation_name;
        let task;
        let uid = 0;
        function cleanup() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 0, 1, duration, delay, easing, css, uid++);
            tick(0, 1);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            if (task)
                task.abort();
            running = true;
            add_render_callback(() => dispatch(node, true, 'start'));
            task = loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(1, 0);
                        dispatch(node, true, 'end');
                        cleanup();
                        return running = false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(t, 1 - t);
                    }
                }
                return running;
            });
        }
        let started = false;
        return {
            start() {
                if (started)
                    return;
                delete_rule(node);
                if (is_function(config)) {
                    config = config();
                    wait().then(go);
                }
                else {
                    go();
                }
            },
            invalidate() {
                started = false;
            },
            end() {
                if (running) {
                    cleanup();
                    running = false;
                }
            }
        };
    }
    function create_bidirectional_transition(node, fn, params, intro) {
        let config = fn(node, params);
        let t = intro ? 0 : 1;
        let running_program = null;
        let pending_program = null;
        let animation_name = null;
        function clear_animation() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function init(program, duration) {
            const d = program.b - t;
            duration *= Math.abs(d);
            return {
                a: t,
                b: program.b,
                d,
                duration,
                start: program.start,
                end: program.start + duration,
                group: program.group
            };
        }
        function go(b) {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            const program = {
                start: now() + delay,
                b
            };
            if (!b) {
                // @ts-ignore todo: improve typings
                program.group = outros;
                outros.r += 1;
            }
            if (running_program || pending_program) {
                pending_program = program;
            }
            else {
                // if this is an intro, and there's a delay, we need to do
                // an initial tick and/or apply CSS animation immediately
                if (css) {
                    clear_animation();
                    animation_name = create_rule(node, t, b, duration, delay, easing, css);
                }
                if (b)
                    tick(0, 1);
                running_program = init(program, duration);
                add_render_callback(() => dispatch(node, b, 'start'));
                loop(now => {
                    if (pending_program && now > pending_program.start) {
                        running_program = init(pending_program, duration);
                        pending_program = null;
                        dispatch(node, running_program.b, 'start');
                        if (css) {
                            clear_animation();
                            animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
                        }
                    }
                    if (running_program) {
                        if (now >= running_program.end) {
                            tick(t = running_program.b, 1 - t);
                            dispatch(node, running_program.b, 'end');
                            if (!pending_program) {
                                // we're done
                                if (running_program.b) {
                                    // intro — we can tidy up immediately
                                    clear_animation();
                                }
                                else {
                                    // outro — needs to be coordinated
                                    if (!--running_program.group.r)
                                        run_all(running_program.group.c);
                                }
                            }
                            running_program = null;
                        }
                        else if (now >= running_program.start) {
                            const p = now - running_program.start;
                            t = running_program.a + running_program.d * easing(p / running_program.duration);
                            tick(t, 1 - t);
                        }
                    }
                    return !!(running_program || pending_program);
                });
            }
        }
        return {
            run(b) {
                if (is_function(config)) {
                    wait().then(() => {
                        // @ts-ignore
                        config = config();
                        go(b);
                    });
                }
                else {
                    go(b);
                }
            },
            end() {
                clear_animation();
                running_program = pending_program = null;
            }
        };
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
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
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
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
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
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
    /**
     * Base class for Svelte components. Used when dev=false.
     */
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
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.31.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/screens/Welcome.svelte generated by Svelte v3.31.0 */
    const file = "src/screens/Welcome.svelte";

    function create_fragment(ctx) {
    	let header;
    	let h1;
    	let t1;
    	let button;
    	let t2;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			header = element("header");
    			h1 = element("h1");
    			h1.textContent = "Jeopardy!";
    			t1 = space();
    			button = element("button");
    			t2 = text("Start the game!");
    			attr_dev(h1, "class", "svelte-1j3pcft");
    			add_location(h1, file, 36, 2, 649);
    			add_location(header, file, 35, 0, 638);
    			button.disabled = /*selected*/ ctx[0];
    			attr_dev(button, "class", "svelte-1j3pcft");
    			add_location(button, file, 39, 0, 679);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, header, anchor);
    			append_dev(header, h1);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, button, anchor);
    			append_dev(button, t2);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[2], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*selected*/ 1) {
    				prop_dev(button, "disabled", /*selected*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(header);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Welcome", slots, []);
    	const dispatch = createEventDispatcher();
    	let selected = false;

    	const start = () => {
    		$$invalidate(0, selected = true);
    		dispatch("start");
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Welcome> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => start();

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		dispatch,
    		selected,
    		start
    	});

    	$$self.$inject_state = $$props => {
    		if ("selected" in $$props) $$invalidate(0, selected = $$props.selected);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [selected, start, click_handler];
    }

    class Welcome extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Welcome",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    /*
    Adapted from https://github.com/mattdesl
    Distributed under MIT License https://github.com/mattdesl/eases/blob/master/LICENSE.md
    */
    function backInOut(t) {
        const s = 1.70158 * 1.525;
        if ((t *= 2) < 1)
            return 0.5 * (t * t * ((s + 1) * t - s));
        return 0.5 * ((t -= 2) * t * ((s + 1) * t + s) + 2);
    }
    function backIn(t) {
        const s = 1.70158;
        return t * t * ((s + 1) * t - s);
    }
    function backOut(t) {
        const s = 1.70158;
        return --t * t * ((s + 1) * t + s) + 1;
    }
    function bounceOut(t) {
        const a = 4.0 / 11.0;
        const b = 8.0 / 11.0;
        const c = 9.0 / 10.0;
        const ca = 4356.0 / 361.0;
        const cb = 35442.0 / 1805.0;
        const cc = 16061.0 / 1805.0;
        const t2 = t * t;
        return t < a
            ? 7.5625 * t2
            : t < b
                ? 9.075 * t2 - 9.9 * t + 3.4
                : t < c
                    ? ca * t2 - cb * t + cc
                    : 10.8 * t * t - 20.52 * t + 10.72;
    }
    function bounceInOut(t) {
        return t < 0.5
            ? 0.5 * (1.0 - bounceOut(1.0 - t * 2.0))
            : 0.5 * bounceOut(t * 2.0 - 1.0) + 0.5;
    }
    function bounceIn(t) {
        return 1.0 - bounceOut(1.0 - t);
    }
    function circInOut(t) {
        if ((t *= 2) < 1)
            return -0.5 * (Math.sqrt(1 - t * t) - 1);
        return 0.5 * (Math.sqrt(1 - (t -= 2) * t) + 1);
    }
    function circIn(t) {
        return 1.0 - Math.sqrt(1.0 - t * t);
    }
    function circOut(t) {
        return Math.sqrt(1 - --t * t);
    }
    function cubicInOut(t) {
        return t < 0.5 ? 4.0 * t * t * t : 0.5 * Math.pow(2.0 * t - 2.0, 3.0) + 1.0;
    }
    function cubicIn(t) {
        return t * t * t;
    }
    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }
    function elasticInOut(t) {
        return t < 0.5
            ? 0.5 *
                Math.sin(((+13.0 * Math.PI) / 2) * 2.0 * t) *
                Math.pow(2.0, 10.0 * (2.0 * t - 1.0))
            : 0.5 *
                Math.sin(((-13.0 * Math.PI) / 2) * (2.0 * t - 1.0 + 1.0)) *
                Math.pow(2.0, -10.0 * (2.0 * t - 1.0)) +
                1.0;
    }
    function elasticIn(t) {
        return Math.sin((13.0 * t * Math.PI) / 2) * Math.pow(2.0, 10.0 * (t - 1.0));
    }
    function elasticOut(t) {
        return (Math.sin((-13.0 * (t + 1.0) * Math.PI) / 2) * Math.pow(2.0, -10.0 * t) + 1.0);
    }
    function expoInOut(t) {
        return t === 0.0 || t === 1.0
            ? t
            : t < 0.5
                ? +0.5 * Math.pow(2.0, 20.0 * t - 10.0)
                : -0.5 * Math.pow(2.0, 10.0 - t * 20.0) + 1.0;
    }
    function expoIn(t) {
        return t === 0.0 ? t : Math.pow(2.0, 10.0 * (t - 1.0));
    }
    function expoOut(t) {
        return t === 1.0 ? t : 1.0 - Math.pow(2.0, -10.0 * t);
    }
    function quadInOut(t) {
        t /= 0.5;
        if (t < 1)
            return 0.5 * t * t;
        t--;
        return -0.5 * (t * (t - 2) - 1);
    }
    function quadIn(t) {
        return t * t;
    }
    function quadOut(t) {
        return -t * (t - 2.0);
    }
    function quartInOut(t) {
        return t < 0.5
            ? +8.0 * Math.pow(t, 4.0)
            : -8.0 * Math.pow(t - 1.0, 4.0) + 1.0;
    }
    function quartIn(t) {
        return Math.pow(t, 4.0);
    }
    function quartOut(t) {
        return Math.pow(t - 1.0, 3.0) * (1.0 - t) + 1.0;
    }
    function quintInOut(t) {
        if ((t *= 2) < 1)
            return 0.5 * t * t * t * t * t;
        return 0.5 * ((t -= 2) * t * t * t * t + 2);
    }
    function quintIn(t) {
        return t * t * t * t * t;
    }
    function quintOut(t) {
        return --t * t * t * t * t + 1;
    }
    function sineInOut(t) {
        return -0.5 * (Math.cos(Math.PI * t) - 1);
    }
    function sineIn(t) {
        const v = Math.cos(t * Math.PI * 0.5);
        if (Math.abs(v) < 1e-14)
            return 1;
        else
            return 1 - v;
    }
    function sineOut(t) {
        return Math.sin((t * Math.PI) / 2);
    }

    var eases = /*#__PURE__*/Object.freeze({
        __proto__: null,
        backIn: backIn,
        backInOut: backInOut,
        backOut: backOut,
        bounceIn: bounceIn,
        bounceInOut: bounceInOut,
        bounceOut: bounceOut,
        circIn: circIn,
        circInOut: circInOut,
        circOut: circOut,
        cubicIn: cubicIn,
        cubicInOut: cubicInOut,
        cubicOut: cubicOut,
        elasticIn: elasticIn,
        elasticInOut: elasticInOut,
        elasticOut: elasticOut,
        expoIn: expoIn,
        expoInOut: expoInOut,
        expoOut: expoOut,
        quadIn: quadIn,
        quadInOut: quadInOut,
        quadOut: quadOut,
        quartIn: quartIn,
        quartInOut: quartInOut,
        quartOut: quartOut,
        quintIn: quintIn,
        quintInOut: quintInOut,
        quintOut: quintOut,
        sineIn: sineIn,
        sineInOut: sineInOut,
        sineOut: sineOut,
        linear: identity
    });

    function scale(node, { delay = 0, duration = 400, easing = cubicOut, start = 0, opacity = 0 }) {
        const style = getComputedStyle(node);
        const target_opacity = +style.opacity;
        const transform = style.transform === 'none' ? '' : style.transform;
        const sd = 1 - start;
        const od = target_opacity * (1 - opacity);
        return {
            delay,
            duration,
            easing,
            css: (_t, u) => `
			transform: ${transform} scale(${1 - (sd * u)});
			opacity: ${target_opacity - (od * u)}
		`
        };
    }

    /* src/components/Card.svelte generated by Svelte v3.31.0 */
    const file$1 = "src/components/Card.svelte";

    // (91:4) {#if showprice}
    function create_if_block(ctx) {
    	let div;
    	let span;
    	let t0;
    	let t1_value = /*celeb*/ ctx[0].price + "";
    	let t1;
    	let span_intro;

    	const block = {
    		c: function create() {
    			div = element("div");
    			span = element("span");
    			t0 = text("$");
    			t1 = text(t1_value);
    			add_location(span, file$1, 92, 8, 1912);
    			attr_dev(div, "class", "price svelte-1nxpmj4");
    			toggle_class(div, "large", /*winner*/ ctx[2]);
    			add_location(div, file$1, 91, 6, 1863);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span);
    			append_dev(span, t0);
    			append_dev(span, t1);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*celeb*/ 1 && t1_value !== (t1_value = /*celeb*/ ctx[0].price + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*winner*/ 4) {
    				toggle_class(div, "large", /*winner*/ ctx[2]);
    			}
    		},
    		i: function intro(local) {
    			if (!span_intro) {
    				add_render_callback(() => {
    					span_intro = create_in_transition(span, scale, { easing: elasticOut, duration: 600 });
    					span_intro.start();
    				});
    			}
    		},
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(91:4) {#if showprice}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div1;
    	let button;
    	let div0;
    	let h2;
    	let a;
    	let t0_value = /*celeb*/ ctx[0].name + "";
    	let t0;
    	let a_href_value;
    	let t1;
    	let p;
    	let t2_value = /*celeb*/ ctx[0].type + "";
    	let t2;
    	let t3;
    	let mounted;
    	let dispose;
    	let if_block = /*showprice*/ ctx[1] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			button = element("button");
    			div0 = element("div");
    			h2 = element("h2");
    			a = element("a");
    			t0 = text(t0_value);
    			t1 = space();
    			p = element("p");
    			t2 = text(t2_value);
    			t3 = space();
    			if (if_block) if_block.c();
    			attr_dev(a, "target", "_blank");
    			attr_dev(a, "href", a_href_value = "https://cameo.com/" + /*celeb*/ ctx[0].id);
    			add_location(a, file$1, 84, 8, 1701);
    			attr_dev(h2, "class", "svelte-1nxpmj4");
    			add_location(h2, file$1, 83, 6, 1688);
    			attr_dev(p, "class", "type svelte-1nxpmj4");
    			add_location(p, file$1, 87, 6, 1792);
    			attr_dev(div0, "class", "details svelte-1nxpmj4");
    			add_location(div0, file$1, 82, 4, 1660);
    			attr_dev(button, "class", "card-inner svelte-1nxpmj4");
    			set_style(button, "background-image", "url(" + /*celeb*/ ctx[0].image + ")");
    			add_location(button, file$1, 78, 2, 1534);
    			attr_dev(div1, "class", "card-outer svelte-1nxpmj4");
    			add_location(div1, file$1, 77, 0, 1507);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, button);
    			append_dev(button, div0);
    			append_dev(div0, h2);
    			append_dev(h2, a);
    			append_dev(a, t0);
    			append_dev(div0, t1);
    			append_dev(div0, p);
    			append_dev(p, t2);
    			append_dev(button, t3);
    			if (if_block) if_block.m(button, null);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[4], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*celeb*/ 1 && t0_value !== (t0_value = /*celeb*/ ctx[0].name + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*celeb*/ 1 && a_href_value !== (a_href_value = "https://cameo.com/" + /*celeb*/ ctx[0].id)) {
    				attr_dev(a, "href", a_href_value);
    			}

    			if (dirty & /*celeb*/ 1 && t2_value !== (t2_value = /*celeb*/ ctx[0].type + "")) set_data_dev(t2, t2_value);

    			if (/*showprice*/ ctx[1]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*showprice*/ 2) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(button, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*celeb*/ 1) {
    				set_style(button, "background-image", "url(" + /*celeb*/ ctx[0].image + ")");
    			}
    		},
    		i: function intro(local) {
    			transition_in(if_block);
    		},
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (if_block) if_block.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Card", slots, []);
    	let { celeb } = $$props;
    	let { showprice } = $$props;
    	let { winner } = $$props;
    	const dispatch = createEventDispatcher();
    	const writable_props = ["celeb", "showprice", "winner"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Card> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => dispatch("select");

    	$$self.$$set = $$props => {
    		if ("celeb" in $$props) $$invalidate(0, celeb = $$props.celeb);
    		if ("showprice" in $$props) $$invalidate(1, showprice = $$props.showprice);
    		if ("winner" in $$props) $$invalidate(2, winner = $$props.winner);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		scale,
    		elasticOut,
    		celeb,
    		showprice,
    		winner,
    		dispatch
    	});

    	$$self.$inject_state = $$props => {
    		if ("celeb" in $$props) $$invalidate(0, celeb = $$props.celeb);
    		if ("showprice" in $$props) $$invalidate(1, showprice = $$props.showprice);
    		if ("winner" in $$props) $$invalidate(2, winner = $$props.winner);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [celeb, showprice, winner, dispatch, click_handler];
    }

    class Card extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { celeb: 0, showprice: 1, winner: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Card",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*celeb*/ ctx[0] === undefined && !("celeb" in props)) {
    			console.warn("<Card> was created without expected prop 'celeb'");
    		}

    		if (/*showprice*/ ctx[1] === undefined && !("showprice" in props)) {
    			console.warn("<Card> was created without expected prop 'showprice'");
    		}

    		if (/*winner*/ ctx[2] === undefined && !("winner" in props)) {
    			console.warn("<Card> was created without expected prop 'winner'");
    		}
    	}

    	get celeb() {
    		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set celeb(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get showprice() {
    		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set showprice(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get winner() {
    		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set winner(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let inited = false;
            const values = [];
            let pending = 0;
            let cleanup = noop;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop;
                }
            };
            const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (inited) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            inited = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
            };
        });
    }

    function scoreBoardStatus() {
      const initialState = [
        { name: 'Player 1', score: 0, isCurrentPlayer: true },
        { name: 'Player 2', score: 0, isCurrentPlayer: false },
        { name: 'Player 3', score: 0, isCurrentPlayer: false },
      ];
      const { subscribe, set, update } = writable(initialState);

      return {
        subscribe,
        addScore: (score) =>
          update((scoreBoard) => {
            const currentPlayerIndex = scoreBoard.findIndex(
              (playerScoreBoard) => playerScoreBoard.isCurrentPlayer
            );
            return [
              ...scoreBoard.slice(0, currentPlayerIndex),
              {
                ...scoreBoard[currentPlayerIndex],
                score: scoreBoard[currentPlayerIndex].score + score,
              },
              ...scoreBoard.slice(currentPlayerIndex + 1),
            ];
          }),
        removeScore: (score) =>
          update((scoreBoard) => {
            const currentPlayerIndex = scoreBoard.findIndex(
              (playerScoreBoard) => playerScoreBoard.isCurrentPlayer
            );
            return [
              ...scoreBoard.slice(0, currentPlayerIndex),
              {
                ...scoreBoard[currentPlayerIndex],
                score: scoreBoard[currentPlayerIndex].score - score,
              },
              ...scoreBoard.slice(currentPlayerIndex + 1),
            ];
          }),
        nextCurrentPlayer: () =>
          update((scoreBoard) => {
            const currentPlayerIndex = scoreBoard.findIndex(
              (playerScoreBoard) => playerScoreBoard.isCurrentPlayer
            );
            const nextPlayerIndex =
              currentPlayerIndex === scoreBoard.length - 1
                ? 0
                : currentPlayerIndex + 1;

            const nextScoreBoard = scoreBoard.map((playerScore, playerIndex) => ({
              ...playerScore,
              isCurrentPlayer: playerIndex === nextPlayerIndex,
            }));

            return nextScoreBoard;
          }),
        reset: () => set(initialState),
      };
    }

    const scoreBoard = scoreBoardStatus();

    /* src/components/Clue.svelte generated by Svelte v3.31.0 */
    const file$2 = "src/components/Clue.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[13] = list[i];
    	return child_ctx;
    }

    // (103:2) {#if revealAnswer}
    function create_if_block$1(ctx) {
    	let div;
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(/*answer*/ ctx[1]);
    			attr_dev(div, "class", "jeopardy-answer svelte-1pt3fbm");
    			add_location(div, file$2, 103, 4, 2188);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*answer*/ 2) set_data_dev(t, /*answer*/ ctx[1]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(103:2) {#if revealAnswer}",
    		ctx
    	});

    	return block;
    }

    // (107:4) {#each $scoreBoard as playerBoard}
    function create_each_block(ctx) {
    	let div1;
    	let div0;
    	let t0_value = /*playerBoard*/ ctx[13].name + "";
    	let t0;
    	let t1;
    	let t2_value = Intl.NumberFormat("en-US").format(/*playerBoard*/ ctx[13].score) + "";
    	let t2;
    	let t3;
    	let div1_class_value;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			t0 = text(t0_value);
    			t1 = text(": $");
    			t2 = text(t2_value);
    			t3 = space();
    			add_location(div0, file$2, 109, 8, 2457);

    			attr_dev(div1, "class", div1_class_value = "" + (null_to_empty(/*playerBoard*/ ctx[13].isCurrentPlayer
    			? "jeopardy-player-score jeopardy-player-score--current"
    			: "jeopardy-player-score") + " svelte-1pt3fbm"));

    			add_location(div1, file$2, 107, 6, 2316);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, t0);
    			append_dev(div0, t1);
    			append_dev(div0, t2);
    			append_dev(div1, t3);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$scoreBoard*/ 8 && t0_value !== (t0_value = /*playerBoard*/ ctx[13].name + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*$scoreBoard*/ 8 && t2_value !== (t2_value = Intl.NumberFormat("en-US").format(/*playerBoard*/ ctx[13].score) + "")) set_data_dev(t2, t2_value);

    			if (dirty & /*$scoreBoard*/ 8 && div1_class_value !== (div1_class_value = "" + (null_to_empty(/*playerBoard*/ ctx[13].isCurrentPlayer
    			? "jeopardy-player-score jeopardy-player-score--current"
    			: "jeopardy-player-score") + " svelte-1pt3fbm"))) {
    				attr_dev(div1, "class", div1_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(107:4) {#each $scoreBoard as playerBoard}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div8;
    	let div0;
    	let t0;
    	let t1;
    	let t2;
    	let div1;
    	let t3;
    	let div7;
    	let t4;
    	let div2;
    	let t6;
    	let div3;
    	let t8;
    	let div4;
    	let t10;
    	let div5;
    	let t12;
    	let div6;
    	let mounted;
    	let dispose;
    	let if_block = /*revealAnswer*/ ctx[2] && create_if_block$1(ctx);
    	let each_value = /*$scoreBoard*/ ctx[3];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div8 = element("div");
    			div0 = element("div");
    			t0 = text(/*clue*/ ctx[0]);
    			t1 = space();
    			if (if_block) if_block.c();
    			t2 = space();
    			div1 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t3 = space();
    			div7 = element("div");
    			t4 = text("Guide:\n    ");
    			div2 = element("div");
    			div2.textContent = "[r] Reveal answer";
    			t6 = space();
    			div3 = element("div");
    			div3.textContent = "[w] player wins score";
    			t8 = space();
    			div4 = element("div");
    			div4.textContent = "[q] player lose score";
    			t10 = space();
    			div5 = element("div");
    			div5.textContent = "[esc] Close clue";
    			t12 = space();
    			div6 = element("div");
    			div6.textContent = "[n] Next player";
    			attr_dev(div0, "class", "jeopardy-clue");
    			add_location(div0, file$2, 101, 2, 2123);
    			attr_dev(div1, "class", "jeopardy-score svelte-1pt3fbm");
    			add_location(div1, file$2, 105, 2, 2242);
    			add_location(div2, file$2, 117, 4, 2644);
    			add_location(div3, file$2, 118, 4, 2677);
    			add_location(div4, file$2, 119, 4, 2714);
    			add_location(div5, file$2, 120, 4, 2751);
    			add_location(div6, file$2, 121, 4, 2783);
    			attr_dev(div7, "class", "jeopardy-guide svelte-1pt3fbm");
    			add_location(div7, file$2, 115, 2, 2600);
    			attr_dev(div8, "class", "jeopardy-clue-wrapper svelte-1pt3fbm");
    			add_location(div8, file$2, 100, 0, 2085);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div8, anchor);
    			append_dev(div8, div0);
    			append_dev(div0, t0);
    			append_dev(div8, t1);
    			if (if_block) if_block.m(div8, null);
    			append_dev(div8, t2);
    			append_dev(div8, div1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			append_dev(div8, t3);
    			append_dev(div8, div7);
    			append_dev(div7, t4);
    			append_dev(div7, div2);
    			append_dev(div7, t6);
    			append_dev(div7, div3);
    			append_dev(div7, t8);
    			append_dev(div7, div4);
    			append_dev(div7, t10);
    			append_dev(div7, div5);
    			append_dev(div7, t12);
    			append_dev(div7, div6);

    			if (!mounted) {
    				dispose = listen_dev(window, "keydown", /*handleKeydown*/ ctx[4], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*clue*/ 1) set_data_dev(t0, /*clue*/ ctx[0]);

    			if (/*revealAnswer*/ ctx[2]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					if_block.m(div8, t2);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*$scoreBoard, Intl*/ 8) {
    				each_value = /*$scoreBoard*/ ctx[3];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div8);
    			if (if_block) if_block.d();
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let $scoreBoard;
    	validate_store(scoreBoard, "scoreBoard");
    	component_subscribe($$self, scoreBoard, $$value => $$invalidate(3, $scoreBoard = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Clue", slots, []);
    	let { clue } = $$props;
    	let { answer } = $$props;
    	let { category } = $$props;
    	let { isDoubleJeopardy } = $$props;
    	let { price } = $$props;
    	let { closeCurrentClue } = $$props;

    	const getCurrentPlayer = () => {
    		return $scoreBoard.find(playerScoreBoard => playerScoreBoard.isCurrentPlayer);
    	};

    	let currentPlayer = getCurrentPlayer();
    	let revealAnswer = false;
    	let timesTried = 0;
    	let tripleStump = false;

    	onMount(() => {
    		getCurrentPlayer();
    	});

    	const handleKeydown = event => {
    		if (event?.key === "Escape") {
    			closeCurrentClue();
    		}

    		if (event?.key === "r") {
    			$$invalidate(2, revealAnswer = true);
    		}

    		if (event?.key === "n") {
    			scoreBoard.nextCurrentPlayer();
    			currentPlayer = getCurrentPlayer();
    		}

    		if (event?.key === "w") {
    			scoreBoard.addScore(price);
    			closeCurrentClue();
    		}

    		if (event?.key === "q") {
    			scoreBoard.removeScore(price);
    			timesTried = timesTried + 1;

    			if (timesTried === $scoreBoard.length) {
    				$$invalidate(2, revealAnswer = true);
    			} else {
    				scoreBoard.nextCurrentPlayer();
    				currentPlayer = getCurrentPlayer();
    			}
    		}
    	};

    	const writable_props = ["clue", "answer", "category", "isDoubleJeopardy", "price", "closeCurrentClue"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Clue> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("clue" in $$props) $$invalidate(0, clue = $$props.clue);
    		if ("answer" in $$props) $$invalidate(1, answer = $$props.answer);
    		if ("category" in $$props) $$invalidate(5, category = $$props.category);
    		if ("isDoubleJeopardy" in $$props) $$invalidate(6, isDoubleJeopardy = $$props.isDoubleJeopardy);
    		if ("price" in $$props) $$invalidate(7, price = $$props.price);
    		if ("closeCurrentClue" in $$props) $$invalidate(8, closeCurrentClue = $$props.closeCurrentClue);
    	};

    	$$self.$capture_state = () => ({
    		afterUpdate,
    		onMount,
    		scoreBoard,
    		clue,
    		answer,
    		category,
    		isDoubleJeopardy,
    		price,
    		closeCurrentClue,
    		getCurrentPlayer,
    		currentPlayer,
    		revealAnswer,
    		timesTried,
    		tripleStump,
    		handleKeydown,
    		$scoreBoard
    	});

    	$$self.$inject_state = $$props => {
    		if ("clue" in $$props) $$invalidate(0, clue = $$props.clue);
    		if ("answer" in $$props) $$invalidate(1, answer = $$props.answer);
    		if ("category" in $$props) $$invalidate(5, category = $$props.category);
    		if ("isDoubleJeopardy" in $$props) $$invalidate(6, isDoubleJeopardy = $$props.isDoubleJeopardy);
    		if ("price" in $$props) $$invalidate(7, price = $$props.price);
    		if ("closeCurrentClue" in $$props) $$invalidate(8, closeCurrentClue = $$props.closeCurrentClue);
    		if ("currentPlayer" in $$props) currentPlayer = $$props.currentPlayer;
    		if ("revealAnswer" in $$props) $$invalidate(2, revealAnswer = $$props.revealAnswer);
    		if ("timesTried" in $$props) timesTried = $$props.timesTried;
    		if ("tripleStump" in $$props) tripleStump = $$props.tripleStump;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		clue,
    		answer,
    		revealAnswer,
    		$scoreBoard,
    		handleKeydown,
    		category,
    		isDoubleJeopardy,
    		price,
    		closeCurrentClue
    	];
    }

    class Clue extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {
    			clue: 0,
    			answer: 1,
    			category: 5,
    			isDoubleJeopardy: 6,
    			price: 7,
    			closeCurrentClue: 8
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Clue",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*clue*/ ctx[0] === undefined && !("clue" in props)) {
    			console.warn("<Clue> was created without expected prop 'clue'");
    		}

    		if (/*answer*/ ctx[1] === undefined && !("answer" in props)) {
    			console.warn("<Clue> was created without expected prop 'answer'");
    		}

    		if (/*category*/ ctx[5] === undefined && !("category" in props)) {
    			console.warn("<Clue> was created without expected prop 'category'");
    		}

    		if (/*isDoubleJeopardy*/ ctx[6] === undefined && !("isDoubleJeopardy" in props)) {
    			console.warn("<Clue> was created without expected prop 'isDoubleJeopardy'");
    		}

    		if (/*price*/ ctx[7] === undefined && !("price" in props)) {
    			console.warn("<Clue> was created without expected prop 'price'");
    		}

    		if (/*closeCurrentClue*/ ctx[8] === undefined && !("closeCurrentClue" in props)) {
    			console.warn("<Clue> was created without expected prop 'closeCurrentClue'");
    		}
    	}

    	get clue() {
    		throw new Error("<Clue>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set clue(value) {
    		throw new Error("<Clue>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get answer() {
    		throw new Error("<Clue>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set answer(value) {
    		throw new Error("<Clue>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get category() {
    		throw new Error("<Clue>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set category(value) {
    		throw new Error("<Clue>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get isDoubleJeopardy() {
    		throw new Error("<Clue>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isDoubleJeopardy(value) {
    		throw new Error("<Clue>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get price() {
    		throw new Error("<Clue>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set price(value) {
    		throw new Error("<Clue>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get closeCurrentClue() {
    		throw new Error("<Clue>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set closeCurrentClue(value) {
    		throw new Error("<Clue>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function gameRoundStatus() {
      const { subscribe, set, update } = writable([]);

      return {
        subscribe,
        initialize: (categories) => set(categories),
        setAnswered: ({ categoryIndex, clueIndex }) =>
          update((categories) => {
            categories[categoryIndex].clues[clueIndex].answered = true;
            return categories;
          }),
        allAnswered: () => update((n) => n - 1),
        reset: () => set([]),
      };
    }

    const gameRound = gameRoundStatus();

    const allAnswered = derived(
      gameRoundStatus,
      ($gameRoundStatus) =>
        $gameRoundStatus.length > 0 &&
        $gameRoundStatus.every((category) =>
          category.clues.every((clue) => clue.answered)
        )
    );

    /* src/screens/Game.svelte generated by Svelte v3.31.0 */
    const file$3 = "src/screens/Game.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[12] = list[i];
    	child_ctx[14] = i;
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[15] = list[i];
    	child_ctx[17] = i;
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[18] = list[i];
    	return child_ctx;
    }

    // (161:6) {#each $gameRound as category}
    function create_each_block_2(ctx) {
    	let div;
    	let t_value = /*category*/ ctx[18].name + "";
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(t_value);
    			attr_dev(div, "class", "jeopardy-board-category svelte-hecbt4");
    			add_location(div, file$3, 161, 8, 3650);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$gameRound*/ 4 && t_value !== (t_value = /*category*/ ctx[18].name + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(161:6) {#each $gameRound as category}",
    		ctx
    	});

    	return block;
    }

    // (176:14) {#if !clue.answered}
    function create_if_block_1(ctx) {
    	let span;
    	let t0;
    	let t1_value = /*clue*/ ctx[15].price + "";
    	let t1;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t0 = text("$");
    			t1 = text(t1_value);
    			add_location(span, file$3, 175, 34, 4252);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t0);
    			append_dev(span, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$gameRound*/ 4 && t1_value !== (t1_value = /*clue*/ ctx[15].price + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(176:14) {#if !clue.answered}",
    		ctx
    	});

    	return block;
    }

    // (169:10) {#each $gameRound[categoryIndex].clues as clue, clueIndex}
    function create_each_block_1(ctx) {
    	let div;
    	let div_class_value;
    	let mounted;
    	let dispose;
    	let if_block = !/*clue*/ ctx[15].answered && create_if_block_1(ctx);

    	function click_handler() {
    		return /*click_handler*/ ctx[6](/*clue*/ ctx[15], /*categoryIndex*/ ctx[14], /*clueIndex*/ ctx[17]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block) if_block.c();

    			attr_dev(div, "class", div_class_value = "" + (null_to_empty(/*clue*/ ctx[15].answered
    			? "jeopardy-board-clue jeopardy-board-clue--disabled"
    			: "jeopardy-board-clue") + " svelte-hecbt4"));

    			add_location(div, file$3, 169, 12, 3945);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block) if_block.m(div, null);

    			if (!mounted) {
    				dispose = listen_dev(div, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (!/*clue*/ ctx[15].answered) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_1(ctx);
    					if_block.c();
    					if_block.m(div, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*$gameRound*/ 4 && div_class_value !== (div_class_value = "" + (null_to_empty(/*clue*/ ctx[15].answered
    			? "jeopardy-board-clue jeopardy-board-clue--disabled"
    			: "jeopardy-board-clue") + " svelte-hecbt4"))) {
    				attr_dev(div, "class", div_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(169:10) {#each $gameRound[categoryIndex].clues as clue, clueIndex}",
    		ctx
    	});

    	return block;
    }

    // (167:6) {#each $gameRound as _, categoryIndex}
    function create_each_block$1(ctx) {
    	let div;
    	let t;
    	let each_value_1 = /*$gameRound*/ ctx[2][/*categoryIndex*/ ctx[14]].clues;
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			attr_dev(div, "class", "jeopardy-board-clues svelte-hecbt4");
    			add_location(div, file$3, 167, 8, 3829);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$gameRound, setCurrentClue*/ 12) {
    				each_value_1 = /*$gameRound*/ ctx[2][/*categoryIndex*/ ctx[14]].clues;
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, t);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(167:6) {#each $gameRound as _, categoryIndex}",
    		ctx
    	});

    	return block;
    }

    // (184:2) {#if Boolean(showSingleClue)}
    function create_if_block$2(ctx) {
    	let div;
    	let clue;
    	let div_transition;
    	let current;

    	const clue_spread_levels = [
    		{
    			closeCurrentClue: /*closeCurrentClue*/ ctx[4]
    		},
    		/*currentClue*/ ctx[0]
    	];

    	let clue_props = {};

    	for (let i = 0; i < clue_spread_levels.length; i += 1) {
    		clue_props = assign(clue_props, clue_spread_levels[i]);
    	}

    	clue = new Clue({ props: clue_props, $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(clue.$$.fragment);
    			attr_dev(div, "class", "jeopardy-clue--absolute svelte-hecbt4");
    			add_location(div, file$3, 184, 4, 4407);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(clue, div, null);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			const clue_changes = (dirty & /*closeCurrentClue, currentClue*/ 17)
    			? get_spread_update(clue_spread_levels, [
    					dirty & /*closeCurrentClue*/ 16 && {
    						closeCurrentClue: /*closeCurrentClue*/ ctx[4]
    					},
    					dirty & /*currentClue*/ 1 && get_spread_object(/*currentClue*/ ctx[0])
    				])
    			: {};

    			clue.$set(clue_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(clue.$$.fragment, local);

    			add_render_callback(() => {
    				if (!div_transition) div_transition = create_bidirectional_transition(
    					div,
    					scale,
    					{
    						duration: 250,
    						delay: 100,
    						opacity: 0.1,
    						start: 0.1,
    						easing: quintOut
    					},
    					true
    				);

    				div_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(clue.$$.fragment, local);

    			if (!div_transition) div_transition = create_bidirectional_transition(
    				div,
    				scale,
    				{
    					duration: 250,
    					delay: 100,
    					opacity: 0.1,
    					start: 0.1,
    					easing: quintOut
    				},
    				false
    			);

    			div_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(clue);
    			if (detaching && div_transition) div_transition.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(184:2) {#if Boolean(showSingleClue)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let div3;
    	let div2;
    	let div0;
    	let t0;
    	let div1;
    	let t1;
    	let show_if = Boolean(/*showSingleClue*/ ctx[1]);
    	let current;
    	let each_value_2 = /*$gameRound*/ ctx[2];
    	validate_each_argument(each_value_2);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks_1[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	let each_value = /*$gameRound*/ ctx[2];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	let if_block = show_if && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div2 = element("div");
    			div0 = element("div");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t0 = space();
    			div1 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t1 = space();
    			if (if_block) if_block.c();
    			attr_dev(div0, "class", "jeopardy-board-categories svelte-hecbt4");
    			add_location(div0, file$3, 159, 4, 3565);
    			attr_dev(div1, "class", "jeopardy-board-columns svelte-hecbt4");
    			add_location(div1, file$3, 165, 4, 3739);
    			attr_dev(div2, "class", "jeopardy-board svelte-hecbt4");
    			add_location(div2, file$3, 158, 2, 3532);
    			attr_dev(div3, "class", "jeopardy-game svelte-hecbt4");
    			add_location(div3, file$3, 157, 0, 3502);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div2);
    			append_dev(div2, div0);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(div0, null);
    			}

    			append_dev(div2, t0);
    			append_dev(div2, div1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			append_dev(div3, t1);
    			if (if_block) if_block.m(div3, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$gameRound*/ 4) {
    				each_value_2 = /*$gameRound*/ ctx[2];
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_2(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(div0, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_2.length;
    			}

    			if (dirty & /*$gameRound, setCurrentClue*/ 12) {
    				each_value = /*$gameRound*/ ctx[2];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*showSingleClue*/ 2) show_if = Boolean(/*showSingleClue*/ ctx[1]);

    			if (show_if) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*showSingleClue*/ 2) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div3, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let $gameRound;
    	validate_store(gameRound, "gameRound");
    	component_subscribe($$self, gameRound, $$value => $$invalidate(2, $gameRound = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Game", slots, []);
    	let { currentRound } = $$props;
    	const dispatch = createEventDispatcher();
    	let data_promise;
    	let currentClue;
    	let currentClueLocation;
    	let showSingleClue = false;

    	onMount(() => {
    		data_promise = loadGame();
    	});

    	afterUpdate(() => {
    		if ($gameRound.length > 0 && $gameRound.every(category => category.clues.every(clue => clue.answered))) {
    			roundOver();
    		}
    	});

    	const loadGame = async () => {
    		let gameData;

    		if (currentRound === "jeopardy") {
    			gameData = "/jeopardy.json";
    		} else if (currentRound === "doubleJeopardy") {
    			gameData = "/doubleJeopardy.json";
    		} else {
    			gameData = "/finalJeopardy.json";
    		}

    		const res = await fetch(gameData);
    		const categories = await res.json();
    		gameRound.initialize(categories);
    	};

    	const roundOver = () => {
    		$$invalidate(0, currentClue = null);
    		currentClueLocation = null;
    		data_promise = null;
    		$$invalidate(1, showSingleClue = false);
    		gameRound.reset();
    		dispatch("next");
    	};

    	const setCurrentClue = (clue, clueLocation) => {
    		$$invalidate(0, currentClue = clue);
    		currentClueLocation = clueLocation;
    		$$invalidate(1, showSingleClue = true);
    	};

    	const closeCurrentClue = () => {
    		gameRound.setAnswered(currentClueLocation);
    		$$invalidate(1, showSingleClue = false);
    	};

    	const writable_props = ["currentRound"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Game> was created with unknown prop '${key}'`);
    	});

    	const click_handler = (clue, categoryIndex, clueIndex) => !clue.answered && setCurrentClue(clue, { categoryIndex, clueIndex });

    	$$self.$$set = $$props => {
    		if ("currentRound" in $$props) $$invalidate(5, currentRound = $$props.currentRound);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		afterUpdate,
    		createEventDispatcher,
    		eases,
    		scale,
    		quintOut,
    		Card,
    		Clue,
    		gameRound,
    		scoreBoard,
    		currentRound,
    		dispatch,
    		data_promise,
    		currentClue,
    		currentClueLocation,
    		showSingleClue,
    		loadGame,
    		roundOver,
    		setCurrentClue,
    		closeCurrentClue,
    		$gameRound
    	});

    	$$self.$inject_state = $$props => {
    		if ("currentRound" in $$props) $$invalidate(5, currentRound = $$props.currentRound);
    		if ("data_promise" in $$props) data_promise = $$props.data_promise;
    		if ("currentClue" in $$props) $$invalidate(0, currentClue = $$props.currentClue);
    		if ("currentClueLocation" in $$props) currentClueLocation = $$props.currentClueLocation;
    		if ("showSingleClue" in $$props) $$invalidate(1, showSingleClue = $$props.showSingleClue);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		currentClue,
    		showSingleClue,
    		$gameRound,
    		setCurrentClue,
    		closeCurrentClue,
    		currentRound,
    		click_handler
    	];
    }

    class Game extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { currentRound: 5 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Game",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*currentRound*/ ctx[5] === undefined && !("currentRound" in props)) {
    			console.warn("<Game> was created without expected prop 'currentRound'");
    		}
    	}

    	get currentRound() {
    		throw new Error("<Game>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set currentRound(value) {
    		throw new Error("<Game>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.31.0 */

    const { console: console_1 } = globals;
    const file$4 = "src/App.svelte";

    // (49:38) 
    function create_if_block_3(ctx) {
    	let game;
    	let current;

    	game = new Game({
    			props: { currentRound: /*state*/ ctx[0] },
    			$$inline: true
    		});

    	game.$on("next", /*nextGameRound*/ ctx[1]);

    	const block = {
    		c: function create() {
    			create_component(game.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(game, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const game_changes = {};
    			if (dirty & /*state*/ 1) game_changes.currentRound = /*state*/ ctx[0];
    			game.$set(game_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(game.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(game.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(game, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(49:38) ",
    		ctx
    	});

    	return block;
    }

    // (47:39) 
    function create_if_block_2(ctx) {
    	let game;
    	let current;

    	game = new Game({
    			props: { currentRound: /*state*/ ctx[0] },
    			$$inline: true
    		});

    	game.$on("next", /*nextGameRound*/ ctx[1]);

    	const block = {
    		c: function create() {
    			create_component(game.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(game, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const game_changes = {};
    			if (dirty & /*state*/ 1) game_changes.currentRound = /*state*/ ctx[0];
    			game.$set(game_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(game.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(game.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(game, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(47:39) ",
    		ctx
    	});

    	return block;
    }

    // (45:33) 
    function create_if_block_1$1(ctx) {
    	let game;
    	let current;

    	game = new Game({
    			props: { currentRound: /*state*/ ctx[0] },
    			$$inline: true
    		});

    	game.$on("next", /*nextGameRound*/ ctx[1]);

    	const block = {
    		c: function create() {
    			create_component(game.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(game, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const game_changes = {};
    			if (dirty & /*state*/ 1) game_changes.currentRound = /*state*/ ctx[0];
    			game.$set(game_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(game.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(game.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(game, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(45:33) ",
    		ctx
    	});

    	return block;
    }

    // (41:2) {#if state === 'welcome'}
    function create_if_block$3(ctx) {
    	let article;
    	let welcome;
    	let current;
    	welcome = new Welcome({ $$inline: true });
    	welcome.$on("start", /*nextGameRound*/ ctx[1]);

    	const block = {
    		c: function create() {
    			article = element("article");
    			create_component(welcome.$$.fragment);
    			attr_dev(article, "class", "svelte-imzktp");
    			add_location(article, file$4, 41, 4, 849);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, article, anchor);
    			mount_component(welcome, article, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(welcome.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(welcome.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(article);
    			destroy_component(welcome);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(41:2) {#if state === 'welcome'}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let main;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	const if_block_creators = [create_if_block$3, create_if_block_1$1, create_if_block_2, create_if_block_3];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*state*/ ctx[0] === "welcome") return 0;
    		if (/*state*/ ctx[0] === "jeopardy") return 1;
    		if (/*state*/ ctx[0] === "doubleJeopardy") return 2;
    		if (/*state*/ ctx[0] === "finalJeopardy") return 3;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	const block = {
    		c: function create() {
    			main = element("main");
    			if (if_block) if_block.c();
    			add_location(main, file$4, 39, 0, 810);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(main, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if (~current_block_type_index) {
    					if_blocks[current_block_type_index].p(ctx, dirty);
    				}
    			} else {
    				if (if_block) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block = if_blocks[current_block_type_index];

    					if (!if_block) {
    						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block.c();
    					} else {
    						if_block.p(ctx, dirty);
    					}

    					transition_in(if_block, 1);
    					if_block.m(main, null);
    				} else {
    					if_block = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	let state = "welcome";

    	const nextGameRound = () => {
    		switch (state) {
    			case "welcome":
    				$$invalidate(0, state = "jeopardy");
    				break;
    			case "jeopardy":
    				$$invalidate(0, state = "doubleJeopardy");
    				break;
    			case "doubleJeopardy":
    				$$invalidate(0, state = "finalJeopardy");
    				break;
    			case "finalJeopardy":
    			default:
    				$$invalidate(0, state = "welcome");
    		}

    		console.log("next game round", state);
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Welcome, Game, state, nextGameRound });

    	$$self.$inject_state = $$props => {
    		if ("state" in $$props) $$invalidate(0, state = $$props.state);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [state, nextGameRound];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    const app = new App({
      target: document.body,
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
