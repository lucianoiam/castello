/*
 * Castello Reverb
 * Copyright (C) 2021 Luciano Iam <oss@lucianoiam.com>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

// This is a collection of bad practices for creating audio oriented widgets.
// Widgets are implemented as tiny controllers for DOM elements. Awww aims to
// achieve minimalism by bending things without breaking them. In practice it
// skips a custom implementation of the traditional UI widget hierarchy, and
// instead expects the developer to leverage standard DOM methods for building
// such. The only rule is to keep bad practices documented for any eventuality.

class Widget {

    constructor(options) {
        if (new.target === Widget) {
            throw new TypeError("Cannot instantiate an abstract class");
        }

        this._options = options;

        // Callers do not get a Widget instance but a DOM element instead.
        // The Widget instance is made available in a custom property.
        // Compliant subclasses must follow this convention:
        
        // return this._constructorEnd( Element ); -- XXX not returning this
    }

    dispose() {
        delete this.el.widget;
        delete this.el;
    }

    _constructorEnd(el) {
        // XXX cyclic reference
        this.el = el;
        this.el.widget = this;
        return this.el;
    }

    _createElement(name) {
        return Awww.createControlEventSources(document.createElement(name));
    }

}

class InputWidget extends Widget {

    constructor(options) {
        if (new.target === InputWidget) {
            throw new TypeError("Cannot instantiate an abstract class");
        }

        super(options);

        this._value = 0;
    }

    get value() {
        return this._value;
    }

    set value(val) {
        this._value = val;
        this._onSetValueExternal(val);
    }

    _onSetValueExternal(val) {
        throw new TypeError("_onSetValueExternal() not defined");
    }

    _setValueInternal(val) {
        // XXX firing built-in events
        this._value = val;
        const ev = new InputEvent('input');
        ev.value = this._value;
        this.el.dispatchEvent(ev);
    }

}

// XXX extending built-in browser classes
class ControlEvent extends UIEvent {

    constructor(name, originalEvent) {
        super(name);
        this.originalEvent = originalEvent;
    }

    get normalX() {
        return (this.clientX - this.target.getBoundingClientRect().left) / this.target.clientWidth;
    }

    get normalY() {
        return (this.clientY - this.target.getBoundingClientRect().top) / this.target.clientHeight;
    }

}

class Awww {

    // Add support for some events that abstract mouse and touch input.

    static createControlEventSources(el) {
        el.addEventListener('touchstart', (srcEv) => {
            const ev = new ControlEvent('controlstart', srcEv);

            ev.clientX = srcEv.touches[0].clientX;
            ev.clientY = srcEv.touches[0].clientY;

            if (srcEv.cancelable) {
                srcEv.preventDefault(); // prevent mousedown
            }

            el.dispatchEvent(ev); // XXX firing events other than CustomEvent
        });

        el.addEventListener('touchmove', (srcEv) => {
            const ev = new ControlEvent('controlmove', srcEv);

            ev.clientX = srcEv.touches[0].clientX;
            ev.clientY = srcEv.touches[0].clientY;

            if (srcEv.cancelable) {
                srcEv.preventDefault(); // prevent mousemove
            }

            el.dispatchEvent(ev); // XXX
        });
        
        el.addEventListener('touchend', (srcEv) => {
            const ev = new ControlEvent('controlend', srcEv);

            if (srcEv.cancelable) {
                srcEv.preventDefault(); // prevent mouseup
            }

            el.dispatchEvent(ev); // XXX
        });

        // Simulate touch behavior, for example react to move events outside element

        const mouseMoveListener = (srcEv) => {
            const ev = new ControlEvent('controlmove', srcEv);

            ev.clientX = srcEv.clientX;
            ev.clientY = srcEv.clientY;

            el.dispatchEvent(ev); // XXX
        };

        const mouseUpListener = (srcEv) => {
            window.removeEventListener('mouseup', mouseUpListener);
            window.removeEventListener('mousemove', mouseMoveListener);

            const ev = new ControlEvent('controlend', srcEv);

            el.dispatchEvent(ev); // XXX
        }
    
        el.addEventListener('mousedown', (srcEv) => {
            window.addEventListener('mousemove', mouseMoveListener);
            window.addEventListener('mouseup', mouseUpListener);

            const ev = new ControlEvent('controlstart', srcEv);

            ev.clientX = srcEv.clientX;
            ev.clientY = srcEv.clientY;

            el.dispatchEvent(ev); // XXX
        });

        return el;
    }

}

class Knob extends InputWidget {

    constructor(options) {
        super(options);

        const div = this._createElement('div');

        div.addEventListener('controlstart', (ev) => {
            console.log(`${ev.clientX} ${ev.clientY}`);
        });

        div.addEventListener('controlmove', (ev) => {
            console.log(`${ev.normalX} ${ev.normalY}`);
        });

        div.addEventListener('controlend', (ev) => {
            console.log('end');
        });

        return this._constructorEnd(div);
    }

    _onSetValueExternal(val) {
        // TODO
    }

}


{ if (typeof(DISTRHO_WebUI) == 'undefined') {

    const el1 = new Knob();

    el1.style.position = 'relative';
    el1.style.width = '100px';
    el1.style.height = '100px';
    el1.style.backgroundColor = '#0f0';

    document.body.appendChild(el1);

    const el2 = new Knob();

    el2.style.position = 'absolute';
    el2.style.top = '10px';
    el2.style.left = '10px';
    el2.style.width = '80px';
    el2.style.height = '80px';
    el2.style.backgroundColor = '#f00';

    el1.appendChild(el2);

    document.body.style.visibility = 'visible';

} }
