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
        
        const feedback = document.createElement('awww-knob');
        feedback.control.minValue = 0;
        feedback.control.maxValue = 1;
        feedback.replaceTemplateById('p-feedback');

        const lpfreq = document.createElement('awww-knob');
        lpfreq.control.minValue = 100;
        lpfreq.control.maxValue = 10000;
        lpfreq.replaceTemplateById('p-lpfreq');

        if (/linux/i.test(window.navigator.platform)) {
            // Avoid pinch zoom, CSS touch-action:none appears to be broken on WebKitGTK.
            _elem('main').addEventListener('touchstart', (ev) => {
                ev.preventDefault();
            });
        }

        this._addEventListeners();
        this._addResizeHandle();

        this.flushInitMessageQueue();

        document.body.style.visibility = 'visible';
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

    _addEventListeners() {
        _elem('p-feedback').addEventListener('input', (ev) => {
            this.setParameterValue(0, ev.target.value);
        });

        _elem('p-lpfreq').addEventListener('input', (ev) => {
            this.setParameterValue(1, ev.target.value);
        });
    }

    async _addResizeHandle() {
        const options = {
        	id: 'resize-handle',
            minWidth: await this.getWidth() / window.devicePixelRatio,
            minHeight: await this.getHeight() / window.devicePixelRatio,
            maxScale: 2,
            keepAspectRatio: true
        };
        const handle = new ResizeHandle((w, h) => this.setSize(w, h), options);
        document.body.appendChild(handle.element);
    }

}
