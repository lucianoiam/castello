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

class CastelloRevUI extends DISTRHO_WebUI {

    constructor() {
        super();

        // Disable pinch zoom, CSS touch-action:none appears to be broken on WebKitGTK.
        if (/linux/i.test(window.navigator.platform)) {
             document.getElementById('main').addEventListener('touchstart', (ev) => {
                ev.preventDefault();
            });
        }

        // Create widgets inserting them at the places specified in the HTML
        this._createInputWidgets();

        // Flush queue after creating widgets to set their initial values,
        // and before calling any async methods otherwise reply never arrives.
        this.flushInitMessageQueue();

        // Setting up the resize handle requires calling async getWidth/Height()
        this._createResizeHandle();

        // Showtime
        document.body.style.visibility = 'visible';
    }

    _createInputWidgets() {
        const feedback = document.createElement('a-knob');
        feedback.opt.minValue = 0;
        feedback.opt.maxValue = 1;
        feedback.addEventListener('input', (ev) => { this.setParameterValue(0, ev.target.value); });
        feedback.replaceTemplateById('p-feedback');

        const lpfreq = document.createElement('a-knob');
        lpfreq.opt.minValue = 100;
        lpfreq.opt.maxValue = 10000;
        lpfreq.addEventListener('input', (ev) => { this.setParameterValue(1, ev.target.value); });
        lpfreq.replaceTemplateById('p-lpfreq');
    }

    async _createResizeHandle() {
        const handle = document.createElement('a-resize-handle');
        handle.opt.minWidth = await this.getWidth() / window.devicePixelRatio;
        handle.opt.minHeight = await this.getHeight() / window.devicePixelRatio;
        handle.opt.keepAspectRatio = true;
        handle.opt.maxScale = 2;
        handle.addEventListener('input', (ev) => { this.setSize(ev.value.width, ev.value.height); });
        handle.appendToBody();
    }

    parameterChanged(index, value) {
        const widget = (id) => document.getElementById(id);

        switch (index) {
            case 0:
                widget('p-feedback').value = value;
                break;

            case 1:
                widget('p-lpfreq').value = value;
                break;
        }
    }

}
