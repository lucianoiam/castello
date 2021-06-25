/*
 * Awww - Audio Warping Web Widgets
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

class ControlEvent extends UIEvent {

    get normalX() {
        return (this.clientX - this.target.getBoundingClientRect().left) / this.target.clientWidth;
    }

    get normalY() {
        return (this.clientY - this.target.getBoundingClientRect().top) / this.target.clientHeight;
    }

}

class AwwwElement extends HTMLElement {

    get opt() {
        // Allow to set options without requiring to first create the options
        // object itself, like this:
        //   const elem = document.createElement('awww-elem');
        //   elem.opt.minValue = 1;

        if (!this._opt) {
            // Trick for returning a reference
            this._opt = function() {};
        }

        return this._opt;
    }

    set opt(optObj) {
        // Also allow to set options using an object, like this:
        //   const elem = document.createElement('awww-elem');
        //   elem.opt = {minValue: 1};

        for (const key in optObj) {
            this.control[key] = optObj[key];
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

    _setValue(value, runInternalCallback) {
        if (this._value == value) {
            return;
        }

        this._value = value;

        if (runInternalCallback !== false) {
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

    static _staticInit() {
        throw new TypeError('_staticInit() not implemented');
    }

}

class ResizeHandle extends AwwwElement {

    _init() {
        super._init();

        // Default minimum size is the current document size
        this._opt.minWidth = this._opt.minWidth || document.body.clientWidth;
        this._opt.minHeight = this._opt.minHeight || document.body.clientHeight;

        if (this._opt.maxScale) {
            // Set the maximum size to maxScale times the minimum size 
            this._opt.maxWidth = this._opt.maxScale * this._opt.minWidth;
            this._opt.maxHeight = this._opt.maxScale * this._opt.minHeight;
        } else {
            // Default maximum size is the device screen size
            this._opt.maxWidth = this._opt.maxWidth || window.screen.width;
            this._opt.maxHeight = this._opt.maxHeight || window.screen.height;
        }

        // Keep aspect ratio while resizing, default to yes
        this._opt.keepAspectRatio = this._opt.keepAspectRatio === false ? false : true;

        // Initialize state
        this._aspectRatio = this._opt.minWidth / this._opt.minHeight;
        this._width = 0;
        this._height = 0;
        
        // Configure element
        switch (this._opt.theme || 'dots') {
            case 'dots':
                this.innerHTML = ResizeHandle._themeSvgData.DOTS;
                break;
            case 'lines':
                this.innerHTML = ResizeHandle._themeSvgData.LINES;
                break;
            default:
                break;
        }

        this.style.position = 'fixed';
        this.style.zIndex = '1000';
        this.style.right = '0px';
        this.style.bottom = '0px';
        this.style.width = '24px';
        this.style.height = '24px';
    }

    _onControlEventStart(ev) {
        this._width = document.body.clientWidth;
        this._height = document.body.clientHeight;
    }

    _onControlEventContinue(ev) {
        // FIXME: On Windows, touchmove events stop triggering after calling callback,
        //        which in turn calls DistrhoUI::setSize(). Mouse resizing works OK.
        let newWidth = Math.max(this._opt.minWidth, Math.min(this._opt.maxWidth, this._width + ev.movementX));
        let newHeight = Math.max(this._opt.minHeight, Math.min(this._opt.maxHeight, this._height + ev.movementY));

        if (this._opt.keepAspectRatio) {
            if (ev.movementX > ev.movementY) {
                newHeight = newWidth / this._aspectRatio;
            } else {
                newWidth = newHeight * this._aspectRatio;
            }
        }

        if ((this._width != newWidth) || (this._height != newHeight)) {
            this._width = newWidth;
            this._height = newHeight;
            const k = window.devicePixelRatio;
            this._setValue({width: k * this._width, height: k * this._height});
        }
    }

    static _staticInit() {
        ResizeHandle._themeSvgData = Object.freeze({
            DOTS: `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
                    <path opacity="0.25" d="M80.5,75.499c0,2.763-2.238,5.001-5,5.001c-2.761,0-5-2.238-5-5.001c0-2.759,2.239-4.999,5-4.999
                        C78.262,70.5,80.5,72.74,80.5,75.499z"/>
                    <path opacity="0.25" d="M50.5,75.499c0,2.763-2.238,5.001-5,5.001c-2.761,0-5-2.238-5-5.001c0-2.759,2.239-4.999,5-4.999
                        C48.262,70.5,50.5,72.74,50.5,75.499z"/>
                    <path opacity="0.25" d="M80.5,45.499c0,2.763-2.238,5.001-5,5.001c-2.761,0-5-2.238-5-5.001c0-2.759,2.239-4.999,5-4.999
                        C78.262,40.5,80.5,42.74,80.5,45.499z"/>
                </svg>`
            ,
            LINES: `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
                    <line stroke="#000000" opacity="0.5" x1="0" y1="100" x2="100" y2="0"/>
                    <line stroke="#000000" opacity="0.5" x1="100" y1="25" x2="25" y2="100"/>
                    <line stroke="#000000" opacity="0.5" x1="50" y1="100" x2="100" y2="50"/>
                    <line stroke="#000000" opacity="0.5" x1="75" y1="100" x2="100" y2="75"/>
                </svg>`
        });

        window.customElements.define('a-resize-handle', this);
    }

}

class Knob extends AwwwElement {

    _init() {
        super._init();

        //this.style.display = 'block';
        
        this.appendChild(document.createElement('label'));
    }

    _onControlEventContinue(ev) {
        // WIP 
        
        const val = this._clamp(this._denormalize(ev.normalX));
        this._setValue(val);
    }

    _onSetValue(value) {
        this.children[0].innerText = Math.floor(10 * value) / 10;
    }

    static _staticInit() {
        window.customElements.define('a-knob', this);
    }

}

{
    for (const clazz of [ResizeHandle, Knob]) {
        clazz._staticInit();
    }
}
