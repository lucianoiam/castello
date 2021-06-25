/*
 * Awww - Audio Workplace Web Widgets
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

class Awww {

    static init() {
        window.customElements.define('awww-knob', AwwwKnob);
    }

}

class AwwwElement extends HTMLElement {

    get control() {
        // Allow to set options without requiring to first create the options
        // object itself, like this:
        //   const elem = document.createElement('awww-elem');
        //   elem.options.minValue = 1;

        if (!this._opt) {
            // Trick for returning a reference
            this._opt = function() {};
        }

        return this._opt;
    }

    set control(opt) {
        // Also allow to set options using an object, like this:
        //   const elem = document.createElement('awww-elem');
        //   elem.options = {minValue: 1};

        for (const key in opt) {
            this.control[key] = opt[key];
        }
    }

    get value() {
        return this._value;
    }

    set value(value) {
        this._setValue(value);
    }

    connectedCallback() {
        if (!this.awwwInitialized) {
            this._init();
            this.awwwInitialized = true;
        }
    }

    replaceTemplateById(id) {
        const old = document.querySelector(`template[id=${id}]`);
        old.parentNode.insertBefore(this, old);
        old.parentNode.removeChild(old);
        
        this.id = id;
        
        return this;
    }

    _init() {   
        this._opt.minValue = this._opt.minValue || 0.0;
        this._opt.maxValue = this._opt.maxValue || 1.0;
        this._value = 0;

        this.style.display = 'block';

        this._createControlEventSources();
    }

    _onControlEventStart(ev) {
        // no-op
    }

    _onControlEventContinue(ev) {
        // no-op
    }

    _onControlEventEnd(ev) {
        // no-op
    }

    _onSetValue(value) {
        // no-op
    }

    _setValue(value, runCallback) {
        if (this._value == value) {
            return;
        }

        this._value = value;

        if (runCallback !== false) {
            this._onSetValue(this._value);
        }

        const ev = new InputEvent('input');
        ev.value = this._value;
        this.dispatchEvent(ev);
    }

    _range() {
        return this._opt.maxValue - this._opt.minValue;
    }

    _normalize(value) {
        return (value - this._opt.minValue) / this._range();
    }

    _denormalize(value) {
        return this._opt.minValue + value * this._range();
    }

    _clamp(value) {
        return Math.max(this._opt.minValue, Math.min(this._opt.maxValue, value));
    }

    // Merge touch and mouse events into a basic single set of custom events

    _createControlEventSources() {

        // Handle touch events preventing subsequent simulated mouse events

        this.addEventListener('touchstart', (ev) => {
            this._handleInputStart(ev, ev.touches[0].clientX, ev.touches[0].clientY);

            if (ev.cancelable) {
                ev.preventDefault();
            }
        });

        this.addEventListener('touchmove', (ev) => {
            this._handleInputContinue(ev, ev.touches[0].clientX, ev.touches[0].clientY);

            if (ev.cancelable) {
                ev.preventDefault();
            }
        });
        
        this.addEventListener('touchend', (ev) => {
            this._handleInputEnd(ev);

            if (ev.cancelable) {
                ev.preventDefault();
            }
        });

        // Simulate touch behavior for mouse, for example react to move events outside element

        const mouseMoveListener = (ev) => {
            this._handleInputContinue(ev, ev.clientX, ev.clientY);
        };

        const mouseUpListener = (ev) => {
            window.removeEventListener('mouseup', mouseUpListener);
            window.removeEventListener('mousemove', mouseMoveListener);

            this._handleInputEnd(ev);
        }
    
        this.addEventListener('mousedown', (ev) => {
            window.addEventListener('mousemove', mouseMoveListener);
            window.addEventListener('mouseup', mouseUpListener);

            this._handleInputStart(ev, ev.clientX, ev.clientY);
        });
    }

    _handleInputStart(originalEvent, clientX, clientY) {
        const ev = this._createControlEvent('controlstart', originalEvent);

        ev.clientX = clientX;
        ev.clientY = clientY;

        this._prevClientX = clientX;
        this._prevClientY = clientY;

        this.dispatchEvent(ev);

        this._onControlEventStart(ev);
    }

    _handleInputContinue(originalEvent, clientX, clientY) {
        const ev = this._createControlEvent('controlcontinue', originalEvent);

        // movementX/Y is not available in TouchEvent instances

        ev.clientX = clientX;
        ev.movementX = clientX - this._prevClientX;
        this._prevClientX = clientX;

        ev.clientY = clientY;
        ev.movementY = clientY - this._prevClientY;
        this._prevClientY = clientY;

        this.dispatchEvent(ev);

        this._onControlEventContinue(ev);
    }

    _handleInputEnd(originalEvent) {
        const ev = this._createControlEvent('controlend', originalEvent);
        this.dispatchEvent(ev);
        this._onControlEventEnd(ev);
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

class ControlEvent extends UIEvent {

    get normalX() {
        return (this.clientX - this.target.getBoundingClientRect().left) / this.target.clientWidth;
    }

    get normalY() {
        return (this.clientY - this.target.getBoundingClientRect().top) / this.target.clientHeight;
    }

}

class AwwwKnob extends AwwwElement {

    _init() {
        super._init();

        this.style.userSelect = 'none';

        this.appendChild(document.createElement('label'));
    }

    _onControlEventContinue(ev) {
        // WIP 
        
        const val = this._clamp(this._denormalize(ev.normalX));
        this._setValue(val, true);
    }

    _onSetValue(value) {
        this.children[0].innerText = Math.floor(10 * value) / 10;
    }

}
