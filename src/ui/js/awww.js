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

class ControlEvent extends UIEvent {

    get normalX() {
        return (this.clientX - this.target.getBoundingClientRect().left) / this.target.clientWidth;
    }

    get normalY() {
        return (this.clientY - this.target.getBoundingClientRect().top) / this.target.clientHeight;
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

}

class AwwwKnob extends AwwwElement {

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

}


// TODO: make this a subclass of AwwwElement

class ResizeHandle {

    constructor(callback, options) {
        this.callback = callback; 

        options = options || {};

        // Default minimum size is the current content size
        this.minWidth = options.minWidth || document.body.clientWidth;
        this.minHeight = options.minHeight || document.body.clientHeight;

        if (options.maxScale) {
            // Set the maximum size to maxScale times the minimum size 
            this.maxWidth = options.maxScale * this.minWidth;
            this.maxHeight = options.maxScale * this.minHeight;
        } else {
            // Default maximum size is the device screen size
            this.maxWidth = options.maxWidth || window.screen.width;
            this.maxHeight = options.maxHeight || window.screen.height;
        }

        // Keep aspect ratio while resizing, default to yes
        this.keepAspectRatio = options.keepAspectRatio === false ? false : true;
        this.aspectRatio = this.minWidth / this.minHeight;

        this.width = 0;
        this.height = 0;
        this.resizing = false;

        this.handle = this._createHandle(options.id, options.theme || 'dots');

        this._addEventListeners();
    }

    get element() {
        return this.handle;
    }

    _createHandle(id, theme) {
        const handle = document.createElement('div');
        
        switch (theme) {
            case 'dots':
                handle.innerHTML = ResizeHandle.themeSvgData.DOTS;
                break;
            case 'lines':
                handle.innerHTML = ResizeHandle.themeSvgData.LINES;
                break;
            default:
                break;
        }

        if (id) {
        	handle.id = id;
        }

        handle.style.position = 'fixed';
        handle.style.zIndex = '1000';
        handle.style.right = '0px';
        handle.style.bottom = '0px';
        handle.style.width = '24px';
        handle.style.height = '24px';

        return handle;
    }

    _addEventListeners() {
        const evOptions = {passive: false};

        ['touchstart', 'mousedown'].forEach((evName) => {
            this.handle.addEventListener(evName, (ev) => {
                this._onDragStart(ev);
                if (ev.cancelable) {
                    ev.preventDefault(); // first handled event wins
                }
            }, evOptions);
        });

        ['touchmove', 'mousemove'].forEach((evName) => {
            window.addEventListener(evName, (ev) => {
                // FIXME: On Windows, touchmove events stop triggering after calling callback,
                //        which in turn calls DistrhoUI::setSize(). Mouse resizing works OK.
                this._onDragContinue(ev);
                if ((ev.target == this.handle) && ev.cancelable) {
                    ev.preventDefault();
                }
            }, evOptions);
        });

        ['touchend', 'mouseup'].forEach((evName) => {
            window.addEventListener(evName, (ev) => {
                this._onDragEnd(ev);
                if ((ev.target == this.handle) && ev.cancelable) {
                    ev.preventDefault();
                }
            }, evOptions);
        });
    }

    _onDragStart(ev) {
        this.resizing = true;

        this.width = document.body.clientWidth;
        this.height = document.body.clientHeight;

        this.x = ev.clientX /* mouse */ || ev.touches[0].clientX;
        this.y = ev.clientY /* mouse */ || ev.touches[0].clientY;
    }

    _onDragContinue(ev) {
        if (!this.resizing) {
            return
        }

        const clientX = ev.clientX || ev.touches[0].clientX;
        const dx = clientX - this.x;
        this.x = clientX;
        let newWidth = Math.max(this.minWidth, Math.min(this.maxWidth, this.width + dx));

        const clientY = ev.clientY || ev.touches[0].clientY;
        const dy = clientY - this.y;
        this.y = clientY;
        let newHeight = Math.max(this.minHeight, Math.min(this.maxHeight, this.height + dy));

        if (this.keepAspectRatio) {
            if (dx > dy) {
                newHeight = newWidth / this.aspectRatio;
            } else {
                newWidth = newHeight * this.aspectRatio;
            }
        }

        if ((this.width != newWidth) || (this.height != newHeight)) {
            this.width = newWidth;
            this.height = newHeight;
            const k = window.devicePixelRatio;
            this.callback(k * this.width, k * this.height);
        }
    }

    _onDragEnd(ev) {
        this.resizing = false;
    }

}

ResizeHandle.themeSvgData = Object.freeze({
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

{
    window.customElements.define('awww-knob', AwwwKnob);
}
