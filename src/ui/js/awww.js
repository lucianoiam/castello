/*
 * Awww - Audio Wildly Wrong Widgets
 * Copyright (C) 2021 Luciano Iam <oss@lucianoiam.com>
 *
 * Permission to use, copy, modify, and/or distribute this software for any purpose with
 * or without fee is hereby granted, provided that the above copyright notice and this
 * permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD
 * TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN
 * NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL
 * DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER
 * IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN
 * CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 */

// Awww is a collection of bad practices for creating audio oriented widgets.
// It aims to achieve minimalism by bending things without breaking them.
// Widgets are implemented as tiny controllers for DOM elements. It deliberately
// skips a custom implementation of the traditional UI widget hierarchy, and
// instead expects the developer to leverage standard DOM methods for building
// such. The only rule is to keep bad practices documented for any eventuality.


// XXX extending built-in classes
class ControlEvent extends UIEvent {

    get normalX() {
        return (this.clientX - this.target.getBoundingClientRect().left) / this.target.clientWidth;
    }

    get normalY() {
        return (this.clientY - this.target.getBoundingClientRect().top) / this.target.clientHeight;
    }

}


// XXX
class AwwwControlledElement extends EventTarget {

    constructor(options) {
        if (new.target === AwwwControlledElement) {
            throw new TypeError("Cannot instantiate an abstract class");
        }

        super();

        this._opt = options || {};
        this._opt.minValue = this._opt.minValue || 0.0;
        this._opt.maxValue = this._opt.maxValue || 1.0;
        this._opt.range = this._opt.maxValue - this._opt.minValue;

        this._value = 0;

        // Callers do not get a Awww instance but a DOM element instead.
        // The Awww instance is made available in a custom property.
        // Compliant subclasses must follow this convention:
        
        // XXX not returning 'this'
        // return this._constructorEnd( Element );
    }

    dispose() {
        delete this.el.control;
        delete this.el;
    }

    replaceElementById(id) {
        const old = document.getElementById(id);
        old.parentNode.insertBefore(this.el, old);
        old.parentNode.removeChild(old);
        this.el.id = id;
        return this.el;
    }

    get value() {
        return this._value;
    }

    set value(value) {
        this._value = value;
        this._onSetValueExternal(value);
    }

    _constructorEnd(el) {
        this.el = this._createControlEventSources(el);

        // XXX cyclic reference
        // XXX custom properties in DOM Node
        this.el.control = this;

        return this.el;
    }

    _onSetValueExternal(value) {
        // no-op
    }

    _setValueInternal(value) {
        // XXX firing built-in events
        if (this._value == value) {
            return;
        }
        this._value = value;
        const ev = new InputEvent('input');
        ev.value = this._value;
        this.dispatchEvent(ev);
    }

    _normalize(value) {
        return (value - this._opt.minValue) / this._opt.range;
    }

    _denormalize(value) {
        return this._opt.minValue + value * this._opt.range;
    }

    _clamp(value) {
        return Math.max(this._opt.minValue, Math.min(this._opt.maxValue, value));
    }

    // Merge touch and mouse events into a basic single set of custom events
    _createControlEventSources(el) {

        // Handle touch events preventing subsequent simulated mouse events

        el.addEventListener('touchstart', (ev) => {
            this._handleControlStart(el, ev, ev.touches[0].clientX, ev.touches[0].clientY);

            if (ev.cancelable) {
                ev.preventDefault();
            }
        });

        el.addEventListener('touchmove', (ev) => {
            this._handleControlMove(el, ev, ev.touches[0].clientX, ev.touches[0].clientY);

            if (ev.cancelable) {
                ev.preventDefault();
            }
        });
        
        el.addEventListener('touchend', (ev) => {
            this._handleControlEnd(el, ev);

            if (ev.cancelable) {
                ev.preventDefault();
            }
        });

        // Simulate touch behavior for mouse, for example react to move events outside element

        const mouseMoveListener = (ev) => {
            this._handleControlMove(el, ev, ev.clientX, ev.clientY);
        };

        const mouseUpListener = (ev) => {
            window.removeEventListener('mouseup', mouseUpListener);
            window.removeEventListener('mousemove', mouseMoveListener);

            this._handleControlEnd(el, ev);
        }
    
        el.addEventListener('mousedown', (ev) => {
            window.addEventListener('mousemove', mouseMoveListener);
            window.addEventListener('mouseup', mouseUpListener);

            this._handleControlStart(el, ev, ev.clientX, ev.clientY);
        });

        return el;
    }

    _handleControlStart(el, originalEvent, clientX, clientY) {
        const ev = this._createControlEvent('controlstart', originalEvent);

        ev.clientX = clientX;
        ev.clientY = clientY;

        this._prevClientX = clientX;
        this._prevClientY = clientY;

        el.dispatchEvent(ev); // XXX firing events other than CustomEvent
    }

    _handleControlMove(el, originalEvent, clientX, clientY) {
        const ev = this._createControlEvent('controlmove', originalEvent);

        // movementX/Y is not available in TouchEvent instances

        ev.clientX = clientX;
        ev.movementX = clientX - this._prevClientX;
        this._prevClientX = clientX;

        ev.clientY = clientY;
        ev.movementY = clientY - this._prevClientY;
        this._prevClientY = clientY;

        el.dispatchEvent(ev); // XXX
    }

    _handleControlEnd(el, originalEvent) {
        el.dispatchEvent(this._createControlEvent('controlend', originalEvent)); // XXX
    }

    _createControlEvent(name, originalEvent) {
        const ev = new ControlEvent(name);
        ev.originalEvent = originalEvent;

        // Copy some standard properties

        ev.shiftKey = originalEvent.shiftKey;
        ev.ctrlKey = originalEvent.ctrlKey;

        return ev;
    }

}


class AwwwUtil {

    static fixLinuxInputTypeRangeTouch() {
        // Is this a bug or by design of WebKitGTK ? input[type=range] sliders
        // are not reacting to touches on that web view. It does not seem to be
        // a dpf-webui bug as touch works as expected for every other element.

        if (!/linux/i.test(window.navigator.platform)) {
            return;
        }

        document.querySelectorAll('input[type=range]').forEach((el) => {
            el.addEventListener('touchmove', (ev) => {
                const minVal = parseFloat(ev.target.min);
                const maxVal = parseFloat(ev.target.max);
                const width = ev.target.offsetWidth;
                const x = ev.touches[0].clientX;                
                const minX = ev.target.getBoundingClientRect().x;
                const maxX = minX + width;
                if ((x < minX) || (x > maxX)) return;
                const normVal = (x - minX) / width;
                const val = minVal + normVal * (maxVal - minVal);
                ev.target.value = val;
                ev.target.dispatchEvent(new CustomEvent('input'));
            });
        });
    }

}


class Knob extends AwwwControlledElement {

    constructor(options) {
        super(options);

        const div = document.createElement('div');
        div.style.userSelect = 'none';

        div.appendChild(document.createElement('label'));

        div.addEventListener('controlmove', (ev) => {

            const val = this._clamp(this._denormalize(ev.normalX));

            this._updateLabel(val);

            this._setValueInternal(val);

        });

        return this._constructorEnd(div);
    }

    _onSetValueExternal(value) {
        this._updateLabel(value);
    }

    _updateLabel(value) {
        this.el.children[0].innerText = Math.floor(10 * value) / 10;
    }

}
