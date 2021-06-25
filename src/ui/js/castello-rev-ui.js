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

    constructor() {
        super();

        const feedback = new Knob({minValue: 0, maxValue: 1});
        feedback.style.width = '100px';
        feedback.style.height = '100px';
        feedback.style.backgroundColor = '#0f0';
        feedback.control.replaceElementById('p-feedback');

        const lpfreq  = new Knob({minValue: 0, maxValue: 10000});
        lpfreq.style.width = '100px';
        lpfreq.style.height = '100px';
        lpfreq.style.backgroundColor = '#0f0';
        lpfreq.control.replaceElementById('p-lpfreq');

        AwwwUtil.fixLinuxInputTypeRangeTouch();

        this._addEventListeners();
        this._addResizeHandle();

        this.flushInitMessageQueue();

        document.body.style.visibility = 'visible';
    }

    parameterChanged(index, value) {
        switch (index) {
            case 0:
                this._control('p-feedback').value = value;
                break;
                
            case 1:
                this._control('p-lpfreq').value = value;
                break;
        }
    }

    _addEventListeners() {
        this._control('p-feedback').addEventListener('input', (ev) => {
            this.setParameterValue(0, parseFloat(ev.target.value));
        });

        this._control('p-lpfreq').addEventListener('input', (ev) => {
            this.setParameterValue(1, parseFloat(ev.target.value));
        });
    }

    _control(id) {
        return document.getElementById(id).control;
    }

    async _addResizeHandle() {
        const options = {
            minWidth: await this.getWidth() / window.devicePixelRatio,
            minHeight: await this.getHeight() / window.devicePixelRatio,
            maxScale: 2,
            keepAspectRatio: true
        };
        const handle = new ResizeHandle((w, h) => this.setSize(w, h), options);
        document.body.appendChild(handle.element);
    }

}
