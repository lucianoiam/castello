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
        this._initialize();
        window.customElements.define(`a-${this._unqualifiedNodeName}`, this);
    }

    constructor(opt) {
        super();

        // Set options and start observing changes. Options passed to the
        // constructor will be overwritten by matching HTML attributes before
        // connectedCallback() is called.

        let updating = false;

        this._opt = new Proxy(opt || {}, {
            set: (obj, prop, value) => {
                obj[prop] = value;

                if (!updating) {
                    updating = true;
                    this._optionUpdated(prop, value);
                    updating = false;
                } else {
                    // Avoid recursion
                }

                return true;
            }
        });

        // Fill in any missing option values using defaults

        for (const desc of this.constructor._attrOptDescriptor) {
            if (!(desc.key in this.opt) && (typeof(desc.default) !== 'undefined')) {
                this.opt[desc.key] = desc.default;
            }
        }
    }

    get opt() {
        return this._opt;
    }

    set opt(opt) {
        Object.assign(this._opt, opt); // merge
    }

    // Custom element lifecycle callbacks

    static get observedAttributes() {
        const This = this.prototype.constructor;
        return This._attrOptDescriptor.map(d => d.key.toLowerCase());
    }

    attributeChangedCallback(name, oldValue, newValue) {
        const This = this.constructor;
        const desc = This._attrOptDescriptor.find(d => name == d.key.toLowerCase());

        if (desc) {
            const valStr = this._attr(desc.key.toLowerCase());
            const val = desc.parser(valStr, null);

            if (val !== null) {
                this.opt[desc.key] = val;
            }
        }
    }

    connectedCallback() {
        // Default empty implementation
    }

    /**
     *  Internal
     */

    static get _unqualifiedNodeName() {
        throw new TypeError(`_unqualifiedNodeName not implemented for ${this.name}`);
    }

    static get _attrOptDescriptor() {
        return [];
    }

    static _initialize() {
        // Default empty implementation
    }

    _attr(name, def) {
        const attr = this.attributes.getNamedItem(name);
        return attr ? attr.value : def;
    }

    _styleProp(name, def) {
        const prop = getComputedStyle(this).getPropertyValue(name).trim();
        return prop.length > 0 ? prop : def;
    }

    _optionUpdated(key, value) {
        // Default empty implementation
    }

}


/**
 *  Base class for widgets that accept and store a value
 */

class InputWidget extends Widget {

    /**
     *  Public
     */

    static get observedAttributes() {
        return super.observedAttributes.concat('value');
    }

    constructor(opt) {
        super(opt);
        this._value = null;  
        ControlTrait.apply(this);
    }

    get value() {
        return this._value;
    }

    set value(newValue) {
        this._value = newValue;
        this._valueUpdated(this.value);
    }

    /**
     *  Internal
     */

    _setValueIfNeededAndDispatch(newValue) {
        if (this._value == newValue) {
            return;
        }

        this.value = newValue;

        const ev = new Event('input');
        ev.value = this._value;
        this.dispatchEvent(ev);
    }

    _valueUpdated(value) {
        // Default empty implementation
    }

}


/**
 *  Base class for widgets that store a value within a range
 */

class RangeInputWidget extends InputWidget {

    /**
     * Public
     */
    
    get value() {
        return super.value; // overriding setter requires overriding getter
    }

    set value(newValue) {
        super.value = this._clamp(newValue);
    }

    connectedCallback() {
        super.connectedCallback();
        this._readAttrValue();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        super.attributeChangedCallback(name, oldValue, newValue);

        this.value = this.value; // clamp in case range changed

        if (name == 'value') {
            this._readAttrValue();
        }
    }

    /**
     * Internal
     */

    static get _attrOptDescriptor() {
        return [
            { key: 'min', parser: ValueParser.float, default: 0 },
            { key: 'max', parser: ValueParser.float, default: 1 }
        ];
    }

    _range() {
        return this.opt.max - this.opt.min;
    }

    _clamp(value) {
        return Math.max(this.opt.min, Math.min(this.opt.max, value));
    }

    _normalize(value) {
        return (value - this.opt.min) / this._range();
    }

    _denormalize(value) {
        return this.opt.min + value * this._range();
    }

    _optionUpdated(key, value) {
        this.value = this.value; // clamp in case range was updated
    }

    /**
     * Private
     */

    _readAttrValue() {
        const val = ValueParser.float(this._attr('value'));
        this.value = !isNaN(val) ? val : this.opt.min;
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


/**
 * Support
 */

class ValueParser {

    static bool(s, def) {
        return ((s === 'true') || (s == 'false')) ? (s == 'true') : def;
    }

    static int(s, def) {
        const val = parseInt(s);
        return !isNaN(val) ? val : def;
    }

    static float(s, def) {
        const val = parseFloat(s);
        return !isNaN(val) ? val : def;
    }

    static str(s, def) {
        return s ?? def;
    }

}


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

    static get _attrOptDescriptor() {
        return [
            { key: 'minWidth'       , parser: ValueParser.int  , default: 100   },
            { key: 'minHeight'      , parser: ValueParser.int  , default: 100   },
            { key: 'maxWidth'       , parser: ValueParser.int  , default: 0     },
            { key: 'maxHeight'      , parser: ValueParser.int  , default: 0     },
            { key: 'maxScale'       , parser: ValueParser.float, default: 2     },
            { key: 'keepAspectRatio', parser: ValueParser.bool , default: false },
        ];
    }

    static _initialize() {
        this._svgData = {
            DOTS: `<svg viewBox="0 0 100 100">
                      <path d="M80.5,75.499c0,2.763-2.238,5.001-5,5.001c-2.761,0-5-2.238-5-5.001c0-2.759,2.239-4.999,5-4.999
                          C78.262,70.5,80.5,72.74,80.5,75.499z"/>
                      <path d="M50.5,75.499c0,2.763-2.238,5.001-5,5.001c-2.761,0-5-2.238-5-5.001c0-2.759,2.239-4.999,5-4.999
                          C48.262,70.5,50.5,72.74,50.5,75.499z"/>
                      <path d="M80.5,45.499c0,2.763-2.238,5.001-5,5.001c-2.761,0-5-2.238-5-5.001c0-2.759,2.239-4.999,5-4.999
                          C78.262,40.5,80.5,42.74,80.5,45.499z"/>
                   </svg>`,
            LINES: `<svg viewBox="0 0 100 100">
                       <line x1="0" y1="100" x2="100" y2="0"/>
                       <line x1="100" y1="25" x2="25" y2="100"/>
                       <line x1="50" y1="100" x2="100" y2="50"/>
                       <line x1="75" y1="100" x2="100" y2="75"/>
                   </svg>`
        };
    }

    constructor() {
        super();
        
        this._width = 0;
        this._height = 0;

        this.addEventListener('controlstart', this._onGrab);
        this.addEventListener('controlcontinue', this._onDrag);
    }

    connectedCallback() {
        super.connectedCallback();

        this.style.position = 'absolute';
        this.style.zIndex = '100';
        this.style.right = '0px';
        this.style.bottom = '0px';

        if (parseInt(this._styleProp('width')) == 0) {
            this.style.width = '37px';
        }

        if (parseInt(this._styleProp('height')) == 0) {
            this.style.height = '37px';
        }

        // Ideally the --graphic style property should be observed for changes
        // so the graphic can be updated at any time. A known method is by
        // implementing a MutableObserver but as of Jul '21 the observer seems
        // to only notify changes in built-in style properties and not custom.

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
    }

    _optionUpdated(key, value) {
       if (this.opt.maxScale > 0) {
            this.opt.maxWidth = this.opt.maxScale * this.opt.minWidth;
            this.opt.maxHeight = this.opt.maxScale * this.opt.minHeight;
        }

        this._aspectRatio = this.opt.minWidth / this.opt.minHeight;
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

            this._setValueIfNeededAndDispatch({
                width: this._width,
                height: this._height
            });
        }
    }

}


class Knob extends RangeInputWidget {

    /**
     *  Internal
     */
    
    static get _unqualifiedNodeName() {
        return 'knob';
    }

    static _initialize() {
        this._trackStartAngle = -135;
        this._trackEndAngle   =  135;

        this._svgData = `<svg viewBox="40 40 220 220">
                            <path class="knob-track" fill="none" stroke="#404040" stroke-width="20"/>
                            <path class="knob-value" fill="none" stroke="#ffffff" stroke-width="20"/>
                         </svg>`;
    }

    constructor() {
        super();

        this.addEventListener('controlstart', this._onGrab);
        this.addEventListener('controlcontinue', this._onMove);
    }

    connectedCallback() {
        super.connectedCallback();

        const This = this.constructor;

        this.innerHTML = This._svgData;
        this.style.display = 'block';
 
        const d = SvgMath.describeArc(150, 150, 100, This._trackStartAngle, This._trackEndAngle);
        this.querySelector('.knob-track').setAttribute('d', d);

        this._readAttrValue();
    }
    
    _valueUpdated() {
        const knobValue = this.querySelector('.knob-value');

        if (!knobValue) {
            return;
        }

        const This = this.constructor;
        const range = Math.abs(This._trackStartAngle) + Math.abs(This._trackEndAngle);
        const endAngle = This._trackStartAngle + range * this._normalize(this.value);
        const d = SvgMath.describeArc(150, 150, 100, This._trackStartAngle, endAngle);
        
        knobValue.setAttribute('d', d);
    }

    /**
     *  Private
     */

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

        this._setValueIfNeededAndDispatch(this._clamp(this._startValue + dv));
    }

}


/**
 *  Static library initialization
 */

{
    [ResizeHandle, Knob].forEach((cls) => cls.define());
}
