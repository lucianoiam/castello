/*
 * Castello Reverb
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

const kVersion = '1.3.0';

const kParameterMix        = 0;
const kParameterSize       = 1;
const kParameterBrightness = 2;

class CastelloReverbUI extends DISTRHO.UI {

    constructor() {
        super();

        document.getElementById('version').innerText = kVersion;

        const formatAsPercentage = (value) => `${Math.ceil(100 * value)}%`;

        this._connect(this._knobMix, kParameterMix, formatAsPercentage);        
        this._connect(this._knobSize, kParameterSize, formatAsPercentage);
        this._connect(this._knobBrightness, kParameterBrightness, formatAsPercentage);

        const resize = document.querySelector('g-resize');

        resize.addEventListener('input', (ev) => {
            const k = window.devicePixelRatio;
            const width = k * ev.value.width;
            const height = k * ev.value.height; 
            this.setSize(width, height);
            this.setState('ui_size', `${width}x${height}`);
        });

        (async () => {
            const w = await this.getInitWidthCSS(),
                  h = await this.getInitHeightCSS();

            resize.opt.minWidth = w;
            resize.opt.minHeight = h;

            this._sizeChanged();

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

    sizeChanged(width, height) {
        this._sizeChanged();
    }

    _sizeChanged() {
        if (DISTRHO.env.fakeViewport) { // Linux GTK web view
            document.querySelectorAll('g-knob').forEach(((el) => {
                const _30vh = (0.3 * document.body.clientHeight) + 'px';
                el.style.height = _30vh;
                el.style.width = el.style.height;
            }));
        }
    }

    _connect(el, parameterIndex, labelFormatCallback) {
        el.addEventListener('input', (ev) => {
            this.setParameterValue(parameterIndex, ev.target.value);
        });

        const updateLabel = (value) => {
            el.parentNode.children[2].innerText = labelFormatCallback(value);
        };

        el.addEventListener('setvalue', (ev) => updateLabel(ev.value));

        updateLabel(el.opt.min);
    }

    get _knobMix() {
        return document.querySelector('#p-mix g-knob');
    }

    get _knobSize() {
        return document.querySelector('#p-size g-knob');
    }

    get _knobBrightness() {
        return document.querySelector('#p-brightness g-knob');
    }

}
