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

class CastelloRevUI extends DISTRHO_WebUI {

    static init() {
        window.widget = (id) => document.getElementById(id); // helper
    }

    constructor() {
        super();

        // Create widgets inserting them at the places specified in the HTML
        this._createInputWidgets();

        // Flush queue after creating widgets to set their initial values,
        // and before calling any async methods otherwise those never complete.
        this.flushInitMessageQueue();

        // Setting up resize handle needs calling async getWidth()/getHeight()
        this._createResizeHandle();

        // Always unhide because stateChanged() is not called for standalone
        document.body.style.visibility = 'visible';
    }

    stateChanged(key, value) {
        if (key == 'ui_size') {
            const wh = value.split('x');

            if (wh.length == 2) {
                this.setSize(parseInt(wh[0]), parseInt(wh[1]));
            }

            // Do not unhide UI until window size is restored
            //document.body.style.visibility = 'visible';
        }
    }

    parameterChanged(index, value) {
        // Host informs a parameter has changed, update its associated widget.

        switch (index) {
            case 0:
                widget('p-feedback').value = value;
                break;

            case 1:
                widget('p-lpfreq').value = value;
                break;
        }
    }

    // FIXME: Allow to set widget options updating widget.opt at any time
    //        Allow to set widget options updating node attributes at any time

    _createInputWidgets() {
        // Feedback knob
        const feedback = widget('p-feedback');
        feedback.opt.minValue = 0;
        feedback.opt.maxValue = 1;
        feedback.addEventListener('input', (ev) => this.setParameterValue(0, ev.target.value));

        // LPF cutoff frequency knob
        const lpfreq = widget('p-lpfreq');
        lpfreq.opt.minValue = 100;
        lpfreq.opt.maxValue = 10000;
        lpfreq.addEventListener('input', (ev) => this.setParameterValue(1, ev.target.value));
    }

    async _createResizeHandle() {
        // Like any other widget the resize handle can be styled using CSS.
        const handle = document.querySelector('a-resize');

        handle.opt.minWidth = await this.getInitWidth() / window.devicePixelRatio;
        handle.opt.minHeight = await this.getInitHeight() / window.devicePixelRatio;
        handle.opt.keepAspectRatio = true;
        handle.opt.maxScale = 2;

        handle.addEventListener('input', (ev) => {
            this.setSize(ev.value.width, ev.value.height);
            this.setState('ui_size', `${ev.value.width}x${ev.value.height}`);
        });
    }

}

CastelloRevUI.init();
