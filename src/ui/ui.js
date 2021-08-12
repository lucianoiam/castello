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

class CastelloReverbUI extends DISTRHO_UI {

    constructor() {
        super();

        // Connect knobs

        this._knobMix = document.querySelector('#p-mix g-knob');
        this._connect(this._knobMix, 0, v => `${Math.ceil(100 * v)}%`);
        
        this._knobFeedback = document.querySelector('#p-feedback g-knob');
        this._connect(this._knobFeedback, 1, v => `${Math.ceil(100 * v)}%`);

        this._knobLpfFreq = document.querySelector('#p-lpfreq g-knob');
        this._connect(this._knobLpfFreq, 2, v => `${Math.ceil(v)} Hz`);

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

            if (await this.isStandalone()) {
                // stateChanged() will not be called for standalone
                document.body.style.visibility = 'visible';
            }
        }) ();
    }

    stateChanged(key, value) {
        if (key == 'ui_size') {
            const wh = value.split('x');

            if (wh.length == 2) {
                this.setSize(parseInt(wh[0]), parseInt(wh[1]));
            }

            // Do not unhide UI until window size is restored

            document.body.style.visibility = 'visible';
        }
    }

    parameterChanged(index, value) {
        // Host informs a parameter has changed, update its associated widget.

        switch (index) {
            case 0:
                this._knobMix.value = value;
                break;
            case 1:
                this._knobFeedback.value = value;
                break;
            case 2:
                this._knobLpfFreq.value = value;
                break;
        }
    }

    /* It is not currently possible to rely on vh/vw/vmin/vmax units on Linux
       due to the way the webview works on that platform. Viewport dimensions
       are fixed to large values to workaround issue with tag LXRESIZEBUG. */

    uiReshape(width, height) {
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
            ui.setParameterValue(parameterIndex, ev.target.value);
        });

        el.addEventListener('setvalue', (ev) => {
            el.parentNode.children[2].innerText = labelFormatCallback(ev.value);
        });
    }

}
