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

const kVersion = '1.0.1';

const kParameterMix        = 0;
const kParameterSize       = 1;
const kParameterBrightness = 2;

class CastelloReverbUI extends DISTRHO.UI {

    constructor() {
        super();

        document.getElementById('version').innerText = kVersion;

        // Connect knobs

        const formatAsPercentage = (value) => `${Math.ceil(100 * value)}%`;

        this._knobMix = document.querySelector('#p-mix g-knob');
        this._connect(this._knobMix, kParameterMix, formatAsPercentage);
        
        this._knobSize = document.querySelector('#p-size g-knob');
        this._connect(this._knobSize, kParameterSize, formatAsPercentage);

        this._knobBrightness = document.querySelector('#p-brightness g-knob');
        this._connect(this._knobBrightness, kParameterBrightness, formatAsPercentage);

        // Connect resize handle

        const resize = document.querySelector('g-resize');

        resize.addEventListener('input', (ev) => {
            const k = window.devicePixelRatio;
            const width = ev.value.width * k;
            const height = ev.value.height * k; 
            this.setSize(width, height);
            this.setState('ui_size', `${width}x${height}`);
        });

        // Setting up resize handle needs calling async methods

        (async () => {
            const k = window.devicePixelRatio,
                  w = await this.getInitWidth(),
                  h = await this.getInitHeight();
            
            resize.opt.minWidth = w / k;
            resize.opt.minHeight = h / k;

            this.sizeChanged(w, h); // WKGTKRESIZEBUG

            document.body.style.visibility = 'visible';
        }) ();
    }

    stateChanged(key, value) {
        if (key == 'ui_size') {
            const wh = value.split('x');

            if (wh.length == 2) {
                this.setSize(parseInt(wh[0]), parseInt(wh[1]));
            }
        }
    }

    parameterChanged(index, value) {
        // Host informs a parameter has changed, update its associated widget.

        switch (index) {
            case kParameterMix:
                this._knobMix.value = value;
                break;
            case kParameterSize:
                this._knobSize.value = value;
                break;
            case kParameterBrightness:
                this._knobBrightness.value = value;
                break;
        }
    }

    /* It is not currently possible to rely on vh/vw/vmin/vmax units on Linux
       due to the GTK web view implementation on such platform. Viewport
       dimensions are fixed to large values to workaround issue with tag
       WKGTKRESIZEBUG. Bug does not apply when opting for the CEF web view. */

    sizeChanged(width, height) {
        if (/linux/i.test(window.navigator.platform)) {
            height /= window.devicePixelRatio;
            
            document.querySelectorAll('g-knob').forEach(((el) => {
                el.style.height = (0.3 * height) + 'px';
                el.style.width = el.style.height;
            }));
        }
    }

    _connect(el, parameterIndex, labelFormatCallback) {
        el.addEventListener('input', (ev) => {
            this.setParameterValue(parameterIndex, ev.target.value);
        });

        function updateLabel(value) {
            el.parentNode.children[2].innerText = labelFormatCallback(value);
        }

        el.addEventListener('setvalue', (ev) => updateLabel(ev.value));

        updateLabel(el.opt.min);
    }

}
