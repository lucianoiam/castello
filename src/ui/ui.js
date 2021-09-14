/*
 * Castello Reverb
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

        // Flush queue after connecting widgets to set their initial values,
        // and before calling any async methods otherwise those never complete.

        this.flushInitMessageQueue();

        // Setting up resize handle needs calling async methods

        (async () => {
            const k = window.devicePixelRatio;
            resize.opt.minWidth = await this.getInitWidth() / k;
            resize.opt.minHeight = await this.getInitHeight() / k;
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
       due to the way the webview works on that platform. Viewport dimensions
       are fixed to large values to workaround issue with tag LXRESIZEBUG. */

    sizeChanged(width, height) {
        if (/linux/i.test(window.navigator.platform)) {
            height /= window.devicePixelRatio;
            
            document.querySelectorAll('g-knob').forEach(((el) => {
                el.style.height = (0.3 * height) + 'px';
                el.style.width = el.style.height;
            }));
        }

        document.body.style.visibility = 'visible';
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
