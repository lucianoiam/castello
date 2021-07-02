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

 /**
  *  Base class for all widgets
  */

class Widget extends HTMLElement {

    /**
     *  Public
     */

    static define() {
        this._init();
        window.customElements.define(`a-${this._unqualifiedNodeName}`, this);
    }

    constructor(opt) {
        super();

        // Options passed to the constructor will be overwritten by matching
        // attributes before connectedCallback() is called.

        let updating = false; // avoid recursion below

        // Listen to opt changes

        this._opt = new Proxy(opt || {}, {
            set: (obj, prop, value) => {
                obj[prop] = value;

                if (!updating) {
                    updating = true;
                    this._optionUpdated(prop, value);
                    updating = false;
                }

                return true;
            }
        });

        // Set defaults

        for (const desc of this.constructor._attrOptDescriptor) {
            if (!(desc.key in this.opt) && (typeof(desc.def) !== 'undefined')) {
                this.opt[desc.key] = desc.def;
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
        return This._attrOptDescriptor.map(d => d.attrName ?? d.key.toLowerCase());
    }

    attributeChangedCallback(name, oldValue, newValue) {
        const This = this.constructor;
        const desc = This._attrOptDescriptor.find(d => name == (d.attrName ?? d.key.toLowerCase()));

        if (desc) {
            const attrVal = this._attr(desc.attrName ?? desc.key.toLowerCase());
            const val = desc.parser(attrVal);

            if (typeof(val) !== 'undefined') {
                this.opt[desc.key] = val;
            }
        }
    }

    connectedCallback() {
        // At this point all options have been parsed from attributes
        this._init();
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

    static _init() {
        // Default empty implementation
    }

    _init() {
        //
        // Concrete classes, ie. the ones that are ultimately instantiated by
        // calling document.createElement() or using the new operator, cannot
        // set properties within their constructor bodies like in this example:
        //
        // constructor() {
        //    super();
        //    this._foo = {};
        // }
        // 
        // Doing so results in a runtime error by design:
        // [NotSupportedError: A newly constructed custom element must not have attributes
        //
        // To avoid the above arror and still enable concrete classes to perform
        // instance initialization, a custom _init() is implemented that gets
        // called whenever the runtime calls this.connectedCallback() on the
        // instance. Setting properties during super(), ie. within the abstract
        // classes constructors is permitted though.
        //
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

    _setValueAndDispatch(newValue) {
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

    attributeChangedCallback(name, oldValue, newValue) {
        super.attributeChangedCallback(name, oldValue, newValue);

        this.value = this.value; // clamp in case range changed

        if (name == 'value') {
            this._readAttrValue();
        }
    }

    get value() {
        return super.value; // overriding setter requires overriding getter
    }

    set value(newValue) {
        super.value = this._clamp(newValue);
    }

    /**
     * Internal
     */

    static get _attrOptDescriptor() {
        return Object.freeze([
            { key: 'minValue', attrName: 'min', parser: AttrParser.float, def: 0 },
            { key: 'maxValue', attrName: 'max', parser: AttrParser.float, def: 1 }
        ]);
    }

    _init() {
        super._init();
        this._readAttrValue();
    }

    _range() {
        return this.opt.maxValue - this.opt.minValue;
    }

    _clamp(value) {
        return Math.max(this.opt.minValue, Math.min(this.opt.maxValue, value));
    }

    _normalize(value) {
        return (value - this.opt.minValue) / this._range();
    }

    _denormalize(value) {
        return this.opt.minValue + value * this._range();
    }

    _optionUpdated(key, value) {
        this.value = this.value; // clamp in case range was updated
    }

    /**
     * Private
     */

    _readAttrValue() {
        const val = AttrParser.float(this._attr('value'));
        this.value = !isNaN(val) ? val : this.opt.minValue;
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

class AttrParser {

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
        return Object.freeze([
            { key: 'minWidth'       , parser: AttrParser.int  , def: 100   },
            { key: 'minHeight'      , parser: AttrParser.int  , def: 100   },
            { key: 'maxWidth'       , parser: AttrParser.int  , def: 0     },
            { key: 'maxHeight'      , parser: AttrParser.int  , def: 0     },
            { key: 'maxScale'       , parser: AttrParser.float, def: 2     },
            { key: 'keepAspectRatio', parser: AttrParser.bool , def: false },
        ]);
    }

    static _init() {
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

    _init() {
        super._init();

        this._width = 0;
        this._height = 0;

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

            this._setValueAndDispatch({
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

    static _init() {
        this._trackStartAngle = -135;
        this._trackEndAngle   =  135;

        this._svgData = `<svg viewBox="40 40 220 220">
                            <path class="knob-track" fill="none" stroke="#404040" stroke-width="20"/>
                            <path class="knob-value" fill="none" stroke="#ffffff" stroke-width="20"/>
                         </svg>`;
    }

    _init() {
        const This = this.constructor;

        this.innerHTML = This._svgData;
        this.style.display = 'block';

        super._init(); // widget html is now ready

        const d = SvgMath.describeArc(150, 150, 100, This._trackStartAngle, This._trackEndAngle);
        this.querySelector('.knob-track').setAttribute('d', d);

        this.addEventListener('controlstart', this._onGrab);
        this.addEventListener('controlcontinue', this._onMove);
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

        this._setValueAndDispatch(this._clamp(this._startValue + dv));
    }

}


/**
 *  Static library initialization
 */

{
    [ResizeHandle, Knob].forEach((cls) => cls.define());
}
