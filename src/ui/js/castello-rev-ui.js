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

const _elem = (id) => document.getElementById(id);

class CastelloRevUI extends DISTRHO_WebUI {

    constructor() {
        super();

        // Avoid pinch zoom, CSS touch-action:none appears to be broken on WebKitGTK.
        if (/linux/i.test(window.navigator.platform)) {
            _elem('main').addEventListener('touchstart', (ev) => {
                ev.preventDefault();
            });
        }

        // Create widgets and insert them at the places specified in the html
        const feedback = document.createElement('a-knob');
        feedback.opt.minValue = 0;
        feedback.opt.maxValue = 1;
        feedback.replaceTemplateById('p-feedback');

        const lpfreq = document.createElement('a-knob');
        lpfreq.opt.minValue = 100;
        lpfreq.opt.maxValue = 10000;
        lpfreq.replaceTemplateById('p-lpfreq');

        // Need to flush queue before calling async methods and after creating
        // parameter widgets so they can be updated from parameterChanged()
        this.flushInitMessageQueue();

        // Setting up the resize handle requires calling async methods
        this._createResizeHandle();

        // Listen to widget input changes
        this._addWidgetListeners();

        // Showtime
        document.body.style.visibility = 'visible';
    }

    async _createResizeHandle() {
        const handle = document.createElement('a-resize-handle');
        handle.opt.minWidth = await this.getWidth() / window.devicePixelRatio;
        handle.opt.minHeight = await this.getHeight() / window.devicePixelRatio;
        handle.opt.maxScale = 2;
        handle.opt.keepAspectRatio = true;

        handle.addEventListener('input', (ev) => {
            this.setSize(ev.value.width, ev.value.height);
        });

        document.body.appendChild(handle);
    }

    _addWidgetListeners() {
        _elem('p-feedback').addEventListener('input', (ev) => {
            this.setParameterValue(0, ev.target.value);
        });

        _elem('p-lpfreq').addEventListener('input', (ev) => {
            this.setParameterValue(1, ev.target.value);
        });
    }

    parameterChanged(index, value) {
        switch (index) {
            case 0:
                _elem('p-feedback').value = value;
                break;

            case 1:
                _elem('p-lpfreq').value = value;
                break;
        }
    }

}
