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

        this.dom = {
            feedback: document.getElementById('p-feedback'),
            lpfreq:   document.getElementById('p-lpfreq')
        };

        Platform.fixLinuxInputTypeRangeTouch();

        const options = {maxScale: 2, keepAspect: true};
        const handle = new ResizeHandle((w, h) => this.setSize(w, h), options);
        document.body.appendChild(handle.element);

        this._setupView();
        
        this.flushInitMessageQueue();

        document.body.style.visibility = 'visible';
    }

    parameterChanged(index, value) {
        switch (index) {
            case 0:
                this.dom.feedback.value = value;
                break;
            case 1:
                this.dom.lpfreq.value = value;
                break;
        }
    }

    _setupView() {
        this.dom.feedback.addEventListener('input', (ev) => {
            this.setParameterValue(0, parseFloat(ev.target.value));
        });

        this.dom.lpfreq.addEventListener('input', (ev) => {
            this.setParameterValue(1, parseFloat(ev.target.value));
        });
    }
}
