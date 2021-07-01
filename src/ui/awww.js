/*
 * Awww - Audio Warpin' Web Widgets
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

 /**
  *  Base class for all widgets
  */

class Widget extends HTMLElement {

    /**
     *  Public
     */

    static define() {
        this._staticInit();
        window.customElements.define(`a-${this._unqualifiedNodeName}`, this);
    }

    get opt() {
        // Allow to set options without requiring to first create the options
        // object itself, like this:
        //   const elem = document.createElement('a-elem');
        //   elem.opt.some = 1;

        if (!this._opt) {
            this._opt = function() {}; // return a reference
        }

        return this._opt;
    }

    set opt(opt) {
        Object.assign(this._opt, opt); // merge
    }

    /**
     *  Internal
     */

    static get _unqualifiedNodeName() {
        throw new TypeError(`_unqualifiedNodeName not implemented for ${this.name}`);
    }

    static _staticInit() {
        // default empty implementation
    }

    connectedCallback() {
        if (!this._instanceInitialized) {
            this._instanceInitialized = true;
            this._instanceInit();
        }
    }

    _instanceInit() {
        //
        // [NotSupportedError: A newly constructed custom element must not have attributes
        //
        // To avoid the error a custom _instanceInit() is implemented that gets
        // called when the runtime calls this.connectedCallback(), because
        // concrete classes [ the ones whose instances are ultimately created by
        // calling document.createElementById() ] must not set attributes in the
        // constructor body, like this:
        //
        // constructor() {
        //    super();
        //    this._foo = {};
        // }
        //
        // There is no problem in setting attributes during super() though.
        //
    }

    _styleProp(name, def) {
        const prop = getComputedStyle(this).getPropertyValue(name).trim();
        return prop.length > 0 ? prop : def;
    }

    // Already existing opt values always take precedence over attributes

    _optAttrBool(key, def, attrName) {
        if ((this.opt[key] !== false) && (this.opt[key] !== true)) {
            this.opt[key] = this._optAttr(key, 'false', attrName) == 'true';
        }
    }

    _optAttrInt(key, def, attrName) {
        if (!isFinite(this.opt[key])) {
            const val = parseInt(this._optAttr(key, def, attrName));
            this.opt[key] = !isNaN(val) ? val : def;
        }
    }

    _optAttrFloat(key, def, attrName) {
        if (!isFinite(this.opt[key])) {
            const val = parseFloat(this._optAttr(key, def, attrName));
            this.opt[key] = !isNaN(val) ? val : def;
       }
    }

    _optAttrString(key, def, attrName) {
        if (!(this.opt[key] instanceof String)) {
            this.opt[key] = this._optAttr(key, def, attrName);
        }
    }

    /**
     * Private
     */

    _optAttr(key, def, attrName) {
        const attr = this.attributes.getNamedItem(attrName ?? key.toLowerCase());
        return attr ? attr.value : def;
    }

}


/**
 *  Base class for widgets that accept and store a value
 */

class InputWidget extends Widget {

    /**
     *  Public
     */

    get value() {
        return this._value;
    }

    set value(value) {
        if (this._value == value) {
            return;
        }

        this._value = value;
        
        // Unlike a regular range HTMLInputElement, externally updating the
        // value will result in an input event being dispatched.
        // HTMLInputElement type=range triggers Event, type=text -> InputEvent.

        const ev = new Event('input');
        ev.value = this._value;
        this.dispatchEvent(ev);
    }

    /**
     *  Internal
     */

    constructor() {
        super();
        this._value = null;  
        ControlTrait.apply(this);
    }

}


/**
 * Traits
 */

class ControlEvent extends UIEvent {}

// Merges touch and mouse input events into a single basic set of custom events

function ControlTrait() {

    // Handle touch events preventing subsequent simulated mouse events

    this.addEventListener('touchstart', (ev) => {
        dispatchControlStart(ev, ev.touches[0].clientX, ev.touches[0].clientY);

        if (ev.cancelable) {
            ev.preventDefault();
        }
    });

    this.addEventListener('touchmove', (ev) => {
        dispatchControlContinue(ev, ev.touches[0].clientX, ev.touches[0].clientY);

        if (ev.cancelable) {
            ev.preventDefault();
        }
    });
    
    this.addEventListener('touchend', (ev) => {
        dispatchControlEnd(ev);

        if (ev.cancelable) {
            ev.preventDefault();
        }
    });

    // Simulate touch behavior for mouse, for example react to move events outside element

    this.addEventListener('mousedown', (ev) => {
        window.addEventListener('mousemove', mouseMoveListener);
        window.addEventListener('mouseup', mouseUpListener);

        dispatchControlStart(ev, ev.clientX, ev.clientY);
    });

    const mouseMoveListener = (ev) => {
        dispatchControlContinue(ev, ev.clientX, ev.clientY);
    };

    const mouseUpListener = (ev) => {
        window.removeEventListener('mouseup', mouseUpListener);
        window.removeEventListener('mousemove', mouseMoveListener);

        dispatchControlEnd(ev);
    };

    const dispatchControlStart = (originalEvent, clientX, clientY) => {
        const ev = createControlEvent('controlstart', originalEvent);

        ev.clientX = clientX;
        ev.clientY = clientY;

        this._prevClientX = clientX;
        this._prevClientY = clientY;

        this.dispatchEvent(ev);
    };

    const dispatchControlContinue = (originalEvent, clientX, clientY) => {
        const ev = createControlEvent('controlcontinue', originalEvent);

        // movementX/Y is not available in TouchEvent instances

        ev.clientX = clientX;
        ev.movementX = clientX - this._prevClientX;
        this._prevClientX = clientX;

        ev.clientY = clientY;
        ev.movementY = clientY - this._prevClientY;
        this._prevClientY = clientY;

        this.dispatchEvent(ev);
    };

    const dispatchControlEnd = (originalEvent) => {
        const ev = createControlEvent('controlend', originalEvent);
        this.dispatchEvent(ev);
    };

    // This works as a static function so function() can be used instead of =>
    function createControlEvent(name, originalEvent) {
        const ev = new ControlEvent(name);
        ev.originalEvent = originalEvent;

        // Copy some standard properties
        ev.shiftKey = originalEvent.shiftKey;
        ev.ctrlKey = originalEvent.ctrlKey;

        return ev;
    }

}

function RangeTrait() {

    this._optAttrFloat('minValue', 0, 'min');
    this._optAttrFloat('maxValue', 1.0, 'max');

    const proto = this.constructor.prototype;

    proto._range = () => {
        return this.opt.maxValue - this.opt.minValue;
    };

    proto._clamp = (value) => {
        return Math.max(this.opt.minValue, Math.min(this.opt.maxValue, value));
    };

    proto._normalize = (value) => {
        return (value - this.opt.minValue) / this._range();
    };

    proto._denormalize = (value) => {
        return this.opt.minValue + value * this._range();
    };

}


/**
 * Support
 */

class SvgMath {

    // http://jsbin.com/quhujowota

    static describeArc(x, y, radius, startAngle, endAngle) {
        const start = this.polarToCartesian(x, y, radius, endAngle);
        const end = this.polarToCartesian(x, y, radius, startAngle);

        const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

        const d = [
            'M', start.x, start.y, 
            'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y
        ].join(' ');

        return d;       
    }

    static polarToCartesian(centerX, centerY, radius, angleInDegrees) {
        const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;

        return {
            x: centerX + (radius * Math.cos(angleInRadians)),
            y: centerY + (radius * Math.sin(angleInRadians))
        };
    }

}


/**
 *  Concrete widget implementations
 */

class ResizeHandle extends InputWidget {

    /**
     *  Internal
     */

    static get _unqualifiedNodeName() {
        return 'resize';
    }

    static _staticInit() {
        this._svgData = Object.freeze({
            DOTS:
               `<svg viewBox="0 0 100 100">
                    <path d="M80.5,75.499c0,2.763-2.238,5.001-5,5.001c-2.761,0-5-2.238-5-5.001c0-2.759,2.239-4.999,5-4.999
                        C78.262,70.5,80.5,72.74,80.5,75.499z"/>
                    <path d="M50.5,75.499c0,2.763-2.238,5.001-5,5.001c-2.761,0-5-2.238-5-5.001c0-2.759,2.239-4.999,5-4.999
                        C48.262,70.5,50.5,72.74,50.5,75.499z"/>
                    <path d="M80.5,45.499c0,2.763-2.238,5.001-5,5.001c-2.761,0-5-2.238-5-5.001c0-2.759,2.239-4.999,5-4.999
                        C78.262,40.5,80.5,42.74,80.5,45.499z"/>
                </svg>`
            ,
            LINES:
               `<svg viewBox="0 0 100 100">
                    <line x1="0" y1="100" x2="100" y2="0"/>
                    <line x1="100" y1="25" x2="25" y2="100"/>
                    <line x1="50" y1="100" x2="100" y2="50"/>
                    <line x1="75" y1="100" x2="100" y2="75"/>
                </svg>`
        });
    }

    _instanceInit() {
        super._instanceInit();

        // Default minimum and maximum size is the parent element size
        const defWidth = this.parentNode.clientWidth;
        const defHeight = this.parentNode.clientHeight;

        this._optAttrInt('minWidth', defWidth);
        this._optAttrInt('minHeight', defHeight);

        this._optAttrFloat('maxScale', 0);

        // Setting maxScale overrides maxWidth and maxHeight
        if (this.opt.maxScale > 0) {
            this.opt.maxWidth = this.opt.maxScale * this.opt.minWidth;
            this.opt.maxHeight = this.opt.maxScale * this.opt.minHeight;
        } else {
            this._optAttrInt('maxWidth', defWidth);
            this._optAttrInt('maxHeight', defHeight);
        }

        // Keep aspect ratio while resizing, default to no
        this._optAttrBool('keepAspectRatio', false);

        // Initialize state
        this._aspectRatio = this.opt.minWidth / this.opt.minHeight;
        this._width = 0;
        this._height = 0;
        
        // No point in allowing CSS customizations for these
        this.style.position = 'absolute';
        this.style.zIndex = '100';
        this.style.right = '0px';
        this.style.bottom = '0px';

        // Configure graphic

        const svgData = this.constructor._svgData;

        switch (this._styleProp('--graphic', 'dots').toLowerCase()) {
            case 'dots':
                this.innerHTML = svgData.DOTS;
                break;
            case 'lines':
                this.innerHTML = svgData.LINES;
                break;
            default:
                break;
        }

        this.addEventListener('controlstart', this._onGrab);
        this.addEventListener('controlcontinue', this._onDrag);
    }

    /**
     *  Private
     */

    _onGrab(ev) {
        this._width = this.parentNode.clientWidth;
        this._height = this.parentNode.clientHeight;
    }

    _onDrag(ev) {
        // Note: On Windows touchmove events stop triggering if the window size is
        //       modified while the listener runs. Does not happen with mousemove.
        let newWidth = this._width + ev.movementX;
        newWidth = Math.max(this.opt.minWidth, Math.min(this.opt.maxWidth, newWidth));

        let newHeight = this._height + ev.movementY;
        newHeight = Math.max(this.opt.minHeight, Math.min(this.opt.maxHeight, newHeight));

        if (this.opt.keepAspectRatio) {
            if (ev.movementX > ev.movementY) {
                newHeight = newWidth / this._aspectRatio;
            } else {
                newWidth = newHeight * this._aspectRatio;
            }
        }

        if ((this._width != newWidth) || (this._height != newHeight)) {
            this._width = newWidth;
            this._height = newHeight;
            this.value = {width: this._width, height: this._height};
        }
    }

}

class Knob extends InputWidget {

    /**
     *  Internal
     */
    
    static get _unqualifiedNodeName() {
        return 'knob';
    }

    static _staticInit() {
        this._trackStartAngle = -135;
        this._trackEndAngle   =  135;

        this._svgData = `<svg viewBox="40 40 220 220">
                            <path class="knob-track" fill="none" stroke="#404040" stroke-width="20"/>
                            <path class="knob-value" fill="none" stroke="#ffffff" stroke-width="20"/>
                         </svg>`;
    }

    _instanceInit() {
        super._instanceInit();

        RangeTrait.apply(this);

        const This = this.constructor;

        this.innerHTML = This._svgData;
        this.style.display = 'block';

        const d = SvgMath.describeArc(150, 150, 100, This._trackStartAngle, This._trackEndAngle);
        this.querySelector('.knob-track').setAttribute('d', d);

        this.addEventListener('input', this._redraw);

        this.addEventListener('controlstart', this._onGrab);
        this.addEventListener('controlcontinue', this._onMove);
    }

    /**
     *  Private
     */

    _redraw() {
        const This = this.constructor;
        const range = Math.abs(This._trackStartAngle) + Math.abs(This._trackEndAngle);
        const endAngle = This._trackStartAngle + range * this._normalize(this.value);
        const d = SvgMath.describeArc(150, 150, 100, This._trackStartAngle, endAngle);
        this.querySelector('.knob-value').setAttribute('d', d);
    }

    _onGrab(ev) {
        this._startValue = this.value;
        this._axisTracker = [];
        this._dragDistance = 0;
    }

    _onMove(ev) {
        const dir = Math.abs(ev.movementX) - Math.abs(ev.movementY);

        if (this._axisTracker.length < 3) {
            this._axisTracker.push(dir);
            return;
        }

        this._axisTracker.shift();
        this._axisTracker.push(dir);

        const axis = this._axisTracker.reduce((n0, n1) => n0 + n1);

        let dv;

        if (axis > 0) {
            this._dragDistance += ev.movementX;
            dv = this._range() * this._dragDistance / this.clientWidth;
        } else {
            this._dragDistance -= ev.movementY;
            dv = this._range() * this._dragDistance / this.clientHeight;
        }

        this.value = this._clamp(this._startValue + dv);
    }

}


/**
 *  Static library initialization
 */

{
    [ResizeHandle, Knob].forEach((cls) => cls.define());
}
