/*
 * Guinda - Audio widgets for web views
 * Copyright (C) 2021-2022 Luciano Iam <oss@lucianoiam.com>
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
        this._initialize();
        window.customElements.define(`g-${this._unqualifiedNodeName}`, this);
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
        this._root = this.attachShadow({mode: 'open'});
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

    _redraw() {
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
        ControlTrait.apply(this, [opt]);
    }

    get value() {
        return this._value;
    }

    set value(newValue) {
        this._value = newValue;
        this._valueUpdated();
        this._dispatchSetValueEvent(this.value);
    }

    /**
     *  Internal
     */

    _setValueAndDispatchInputEventIfNeeded(newValue) {
        if (this._value == newValue) {
            return;
        }

        this.value = newValue;
        this._dispatchInputEvent(newValue);
    }

    _valueUpdated() {
        if (this._root) {
            this._redraw();
        }
    }

    _dispatchSetValueEvent(val) {
        const ev = new Event('setvalue');
        ev.value = val;
        this.dispatchEvent(ev);
    }

    _dispatchInputEvent(val) {
        const ev = new Event('input');
        ev.value = val;
        this.dispatchEvent(ev);
    }

}


/**
 *  Base class for widgets that store a value within a range
 */

class RangeInputWidget extends InputWidget {

    /**
     *  Public
     */
    
    get value() {
        return this._denormalize(super.value);
    }

    set value(newValue) {
        this._denormalizedValue = newValue;
        super.value = this._normalize(this._clamp(newValue));
    }

    connectedCallback() {
        super.connectedCallback();
        this._readAttrValue();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        super.attributeChangedCallback(name, oldValue, newValue);

        if ((name == 'min') || (name == 'max') || (name == 'scale')) {
            this.value = this._denormalizedValue;
        } else if (name == 'value') {
            this._readAttrValue();
        }
    }

    /**
     *  Internal
     */

    static get _attrOptDescriptor() {
        return super._attrOptDescriptor.concat([
            { key: 'min'  , parser: ValueParser.float, default: 0                 },
            { key: 'max'  , parser: ValueParser.float, default: 1                 },
            { key: 'scale', parser: ValueParser.scale, default: ValueScale.linear }
        ]);
    }

    _optionUpdated(key, value) {
        super._optionUpdated(key, value);

        if ((key == 'min') || (key == 'max') || (key == 'scale')) {
            this.value = this._denormalizedValue;
        }
    }

    _setNormalizedValueAndDispatchInputEventIfNeeded(newValue) {
        if (this._value == newValue) {
            return;
        }

        // Do not use this.value since newValue is already normalized
        this._value = newValue;
        this._valueUpdated();

        const dnval = this.value;
        this._dispatchInputEvent(dnval);
        this._dispatchSetValueEvent(dnval);
    }

    _clamp(value) {
        return Math.max(this.opt.min, Math.min(this.opt.max, value));
    }

    _normalize(value) {
        return this._valueScale.normalize(value, this.opt.min, this.opt.max);
    }

    _denormalize(value) {
        return this._valueScale.denormalize(value, this.opt.min, this.opt.max);
    }

    get _valueScale() {
        return this.opt.scale || ValueScale.linear;
    }

    /**
     *  Private
     */

    _readAttrValue() {
        const val = ValueParser.float(this._attr('value'));
        this.value = !isNaN(val) ? val : this.opt.min;
    }

}


/**
 *  Traits
 */

class ControlEvent extends UIEvent {}

// Merges touch and mouse input events into a single basic set of custom events

function ControlTrait(opt) {
    opt = opt || {}; // currently unused

    this._controlStarted = false;
    this._controlTimeout = null;

    // Synthesize a getter to keep this._controlStarted effectively private

    Object.defineProperty(this, 'isControlStarted', { get: () => this._controlStarted });

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

    // Special treatment for wheel: synthesize start, continue and end events

    this.addEventListener('wheel', (ev) => {
        if (!this._controlStarted) {
            dispatchControlStart(ev, ev.clientX, ev.clientY);
        }

        const k = ev.shiftKey ? 2 : 1;
        const inv = ev.webkitDirectionInvertedFromDevice ? -1 : 1;
        const clientX = this._prevClientX + k * inv * Math.sign(ev.deltaX);
        const clientY = this._prevClientY + k * inv * Math.sign(ev.deltaY);
        
        dispatchControlContinue(ev, clientX, clientY);

        if (this._controlTimeout) {
            clearTimeout(this._controlTimeout);
        }

        this._controlTimeout = setTimeout(() => {
            this._controlTimeout = null;
            dispatchControlEnd(ev);
        }, 100);

        ev.preventDefault();
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
        this._controlStarted = true;

        this._prevClientX = clientX;
        this._prevClientY = clientY;

        const ev = createControlEvent('controlstart', originalEvent, clientX, clientY);

        this.dispatchEvent(ev);
    };

    const dispatchControlContinue = (originalEvent, clientX, clientY) => {
        const ev = createControlEvent('controlcontinue', originalEvent, clientX, clientY);
        
        ev.deltaX = clientX - this._prevClientX;
        ev.deltaY = clientY - this._prevClientY;

        this._prevClientX = clientX;
        this._prevClientY = clientY;

        this.dispatchEvent(ev);
    };

    const dispatchControlEnd = (originalEvent) => {
        this._controlStarted = false;
        const ev = createControlEvent('controlend', originalEvent,
                                        this._prevClientX, this._prevClientY);
        this.dispatchEvent(ev);
    };

    // This works as a static function. Because 'this' is not needed,
    // function() can be used instead of =>
    function createControlEvent(name, originalEvent, clientX, clientY) {
        const ev = new ControlEvent(name);
        ev.originalEvent = originalEvent;
        ev.shiftKey = originalEvent.shiftKey;
        ev.ctrlKey = originalEvent.ctrlKey;
        ev.isInputMouse = originalEvent instanceof MouseEvent;
        ev.isInputWheel = originalEvent instanceof WheelEvent;
        ev.isInputTouch = (typeof TouchEvent !== 'undefined') && originalEvent instanceof TouchEvent;
        ev.clientX = clientY;
        ev.clientY = clientY;
        return ev;
    }

}


/**
 *  Value scales
 */

const ValueScale = {

    linear: {
        normalize: (val, min, max) => {
            return (val - min) / (max - min);
        },
        denormalize: (val, min, max) => {
            return min + (max - min) * val;
        }
    },

    log: {
        normalize: (val, min, max) => {
            min = Math.log(min);
            max = Math.log(max);
            return (Math.log(val) - min) / (max - min);
        },
        denormalize: (val, min, max) => {
            min = Math.log(min);
            max = Math.log(max);
            return Math.exp(min + (max - min) * val);
        }
    },

    db: {
        normalize: (val, min, max) => {
            return Math.pow(10.0, (val - max) / (max - min));
        },
        denormalize: (val, min, max) => {
            return max + (max - min) * Math.log10(val);
        }
    }

};


/**
 *  Support
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

    static string(s, def) {
        return s ? s : def;
    }

    static scale(s, def) {
        return ValueScale[s] ? ValueScale[s] : def;
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
        return super._attrOptDescriptor.concat([
            { key: 'minWidth'       , parser: ValueParser.int  , default: 100   },
            { key: 'minHeight'      , parser: ValueParser.int  , default: 100   },
            { key: 'maxWidth'       , parser: ValueParser.int  , default: 0     },
            { key: 'maxHeight'      , parser: ValueParser.int  , default: 0     },
            { key: 'maxScale'       , parser: ValueParser.float, default: 2     },
            { key: 'keepAspectRatio', parser: ValueParser.bool , default: false },
        ]);
    }

    static _initialize() {
        this._svgData = {
            LINES_1: `<svg viewBox="10 10 100 100">
                        <line x1="100" y1="50" x2="50" y2="100" stroke-width="5"/>
                        <line x1="75" y1="100" x2="100" y2="75" stroke-width="5"/>
                      </svg>`,
            LINES_2: `<svg viewBox="0 0 100 100">
                        <line x1="0" y1="100" x2="100" y2="0"/>
                        <line x1="100" y1="25" x2="25" y2="100"/>
                        <line x1="50" y1="100" x2="100" y2="50"/>
                        <line x1="75" y1="100" x2="100" y2="75"/>
                      </svg>`,
            DOTS: `<svg viewBox="0 0 100 100">
                     <path d="M80.5,75.499c0,2.763-2.238,5.001-5,5.001c-2.761,0-5-2.238-5-5.001c0-2.759,2.239-4.999,5-4.999
                       C78.262,70.5,80.5,72.74,80.5,75.499z"/>
                     <path d="M50.5,75.499c0,2.763-2.238,5.001-5,5.001c-2.761,0-5-2.238-5-5.001c0-2.759,2.239-4.999,5-4.999
                       C48.262,70.5,50.5,72.74,50.5,75.499z"/>
                     <path d="M80.5,45.499c0,2.763-2.238,5.001-5,5.001c-2.761,0-5-2.238-5-5.001c0-2.759,2.239-4.999,5-4.999
                       C78.262,40.5,80.5,42.74,80.5,45.499z"/>
                   </svg>`
        };
    }

    constructor() {
        super();
        
        this._width = 0;
        this._height = 0;

        this.addEventListener('controlstart', this._onGrab);
        this.addEventListener('controlcontinue', this._onDrag);

        const unsetCursorIfNeeded = (ev) => {
            if (!this.isControlStarted && !this._isMouseIn) {
                document.body.style.cursor = null;
            }
        };

        this.addEventListener('controlend', unsetCursorIfNeeded);

        this.addEventListener('mouseenter', (ev) => {
            this._isMouseIn = true;
            document.body.style.cursor = 'nwse-resize';
        });

        this.addEventListener('mouseleave', () => {
            this._isMouseIn = false;
            unsetCursorIfNeeded();
        });
    }

    connectedCallback() {
        super.connectedCallback();

        this.style.position = 'absolute';
        this.style.zIndex = '100';
        this.style.right = '0px';
        this.style.bottom = '0px';

        if (parseInt(this._styleProp('width')) == 0) {
            this.style.width = '24px';
        }

        if (parseInt(this._styleProp('height')) == 0) {
            this.style.height = '24px';
        }

        // Style property changes can be observed implementing MutableObserver
        // but that only works for built-in style properties and not custom.

        const color = this._styleProp('--color', '#000');

        this._root.innerHTML = `<style>
            path { fill: ${color}; }
            line { stroke: ${color}; }
        </style>`;

        const svgData = this.constructor._svgData;

        switch (this._styleProp('--graphic', 'lines').toLowerCase()) {
            case 'lines':
            case 'lines-1':
                this._root.innerHTML += svgData.LINES_1;
                break;
            case 'lines-2':
                this._root.innerHTML += svgData.LINES_2;
                break;
            case 'dots':
                this._root.innerHTML += svgData.DOTS;
                break;
            default:
                break;
        }
    }

    _optionUpdated(key, value) {
        super._optionUpdated(key, value);

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
        // Note 1: Relying on MouseEvent movementX/Y results in a smoother movement
        //         on Mac though it will be slower on REAPER due to UI refresh rate.
        // Note 2: On Windows touchmove events stop triggering if the window size is
        //         modified while the listener runs. Does not happen with mousemove.

        const useMouseDelta = /mac/i.test(window.navigator.platform) && ev.isInputMouse;
        const deltaX = useMouseDelta ? ev.originalEvent.movementX : ev.deltaX;
        const deltaY = useMouseDelta ? ev.originalEvent.movementY : ev.deltaY;
        
        let newWidth = this._width + deltaX;
        newWidth = Math.max(this.opt.minWidth, Math.min(this.opt.maxWidth, newWidth));

        let newHeight = this._height + deltaY;
        newHeight = Math.max(this.opt.minHeight, Math.min(this.opt.maxHeight, newHeight));

        if (this.opt.keepAspectRatio) {
            if (deltaX > deltaY) {
                newHeight = newWidth / this._aspectRatio;
            } else {
                newWidth = newHeight * this._aspectRatio;
            }
        }

        if ((this._width != newWidth) || (this._height != newHeight)) {
            this._width = newWidth;
            this._height = newHeight;

            this._setValueAndDispatchInputEventIfNeeded({
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
                            <g id="knob">
                                <circle id="circle" cx="150" cy="150" r="85"/>
                                <circle id="dot" cx="150" cy="90" r="7.5"/>
                            </g>
                            <path id="track" fill="none" stroke-width="20"/>
                            <path id="value" fill="none" stroke-width="20"/>
                         </svg>`;
    }

    constructor() {
        super();

        this.addEventListener('controlstart', this._onGrab);
        this.addEventListener('controlcontinue', this._onMove);
        this.addEventListener('controlend', this._onRelease);
    }

    connectedCallback() {
        super.connectedCallback();

        this._root.innerHTML = `<style>
            #circle { fill: ${this._styleProp('--circle-color', '#404040')}; }
            #track { stroke: ${this._styleProp('--track-color', '#404040')}; }
            #value { stroke: ${this._styleProp('--value-color', '#ffffff')}; }
        </style>`;

        const This = this.constructor;

        this._root.innerHTML += This._svgData;
        this.style.display = 'block';
 
        const d = SvgMath.describeArc(150, 150, 100, This._trackStartAngle, This._trackEndAngle);
        this._root.getElementById('track').setAttribute('d', d);

        this._readAttrValue();
    }
    
    _redraw() {
        const knob = this._root.getElementById('knob');
        const knobDot = this._root.getElementById('dot');
        const knobValue = this._root.getElementById('value');

        if (!knob) {
            return;
        }

        const This = this.constructor;
        const range = Math.abs(This._trackStartAngle) + Math.abs(This._trackEndAngle);
        const endAngle = This._trackStartAngle + range * this._value;

        knob.setAttribute('transform', `rotate(${endAngle}, 150, 150)`);
        knobDot.style.fill = endAngle == This._trackStartAngle ? this._styleProp('--dot-off-color', '#000') 
                             : this._styleProp('--dot-on-color', window.getComputedStyle(knobValue).stroke);
        knobValue.setAttribute('d', SvgMath.describeArc(150, 150, 100, This._trackStartAngle, endAngle));
    }

    /**
     *  Private
     */

    _onGrab(ev) {
        this._startValue = this._value;
        this._axisTracker = [];
        this._dragDistance = 0;
    }

    _onMove(ev) {
        // Note: REAPER throttles down UI refresh rate so relying on MouseEvent
        //       movementX/Y results in slow response. Use synthetic deltaX/deltaY.

        const dir = Math.abs(ev.deltaX) - Math.abs(ev.deltaY);

        this._axisTracker.push(dir);

        const axis = this._axisTracker.reduce((n0, n1) => n0 + n1);

        if (this._axisTracker.length > 20) {
            this._axisTracker.shift();
        }

        if (ev.isInputWheel) {
            document.body.style.cursor = axis > 0 ? 'ew-resize' : 'ns-resize';
        } else {
            document.body.style.cursor = 'none';
        }

        const dmov = axis > 0 ? ev.deltaX : -ev.deltaY;
        const k0 = 0.1;
        const k1 = 0.04 * (dmov < 0 ? -1 : 1);

        this._dragDistance += k0 * dmov + k1 * Math.pow(dmov, 2);

        const dval = this._dragDistance / this.clientWidth;
        const val = Math.max(0, Math.min(1.0, this._startValue + dval));

        this._setNormalizedValueAndDispatchInputEventIfNeeded(val);
    }

    _onRelease(ev) {
        document.body.style.cursor = null;
    }

}


/**
 *  Static library initialization
 */

{
    [ResizeHandle, Knob].forEach((cls) => cls.define());
}
