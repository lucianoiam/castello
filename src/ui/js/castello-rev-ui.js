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

        // Convenience function
        window._elem = (id) => document.getElementById(id);

        // Disable pinch zoom, CSS touch-action:none appears to be broken on WebKitGTK.
        if (/linux/i.test(window.navigator.platform)) {
            _elem('main').addEventListener('touchstart', (ev) => {
                ev.preventDefault();
            });
        }

        // Create widgets and insert them at the places specified in the HTML
        const feedback = document.createElement('a-knob');
        feedback.opt.minValue = 0;
        feedback.opt.maxValue = 1;
        feedback.replaceTemplateById('p-feedback');

        const lpfreq = document.createElement('a-knob');
        lpfreq.opt.minValue = 100;
        lpfreq.opt.maxValue = 10000;
        lpfreq.replaceTemplateById('p-lpfreq');

        // Flush queue after creating widgets to set their initial values,
        // and before calling any async methods otherwise reply never arrives.
        this.flushInitMessageQueue();

        // Setting up the resize handle requires calling async getWidth/Height()
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
        handle.opt.keepAspectRatio = true;
        handle.opt.maxScale = 2;

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
