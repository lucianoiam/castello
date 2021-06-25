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
        
        const feedback = document.createElement('awww-knob');
        feedback.control.minValue = 0;
        feedback.control.maxValue = 1;
        feedback.style.width = '100px';
        feedback.style.height = '100px';
        feedback.style.backgroundColor = '#0f0';
        feedback.replaceTemplateById('p-feedback');

        const lpfreq = document.createElement('awww-knob');
        lpfreq.control.minValue = 100;
        lpfreq.control.maxValue = 10000;
        lpfreq.style.width = '100px';
        lpfreq.style.height = '100px';
        lpfreq.style.backgroundColor = '#0f0';
        lpfreq.replaceTemplateById('p-lpfreq');

        if (/linux/i.test(window.navigator.platform)) {
            // Avoid pinch zoom, CSS touch-action:none appears to be broken on WebKitGTK.
            document.getElementById('main').addEventListener('touchstart', (ev) => {
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
                this._elem('p-feedback').value = value;
                break;

            case 1:
                this._elem('p-lpfreq').value = value;
                break;
        }
    }

    _addEventListeners() {
        this._elem('p-feedback').addEventListener('input', (ev) => {
            this.setParameterValue(0, parseFloat(ev.target.value));
        });

        this._elem('p-lpfreq').addEventListener('input', (ev) => {
            this.setParameterValue(1, parseFloat(ev.target.value));
        });
    }

    _elem(id) {
        return document.getElementById(id);
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
