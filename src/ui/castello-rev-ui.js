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

class CastelloRevUI extends WebUI {

    constructor() {
        super();

        this.dom = {
            feedback: document.getElementById('p-feedback'),
            lpfreq:   document.getElementById('p-lpfreq')
        };

        if (/linux/i.test(window.navigator.platform)) {
            this._fixLinuxTouchSliders();
        }
        
        this.dom.feedback.addEventListener('input', (ev) => {
            this.setParameterValue(0, parseFloat(ev.target.value));
        });

        this.dom.lpfreq.addEventListener('input', (ev) => {
            this.setParameterValue(1, parseFloat(ev.target.value));
        });

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

    _fixLinuxTouchSliders() {
        document.querySelectorAll('input[type=range]').forEach((el) => {
            el.addEventListener('touchmove', (ev) => {
                const x = ev.touches[0].clientX;
                const x0 = ev.target.getBoundingClientRect().x;
                const x1 = x0 + ev.target.offsetWidth;
                if ((x < x0) || (x > x1)) return;
                const normVal = (x - x0) / ev.target.offsetWidth;
                const min = parseFloat(ev.target.min);
                const max = parseFloat(ev.target.max);
                const val = min + normVal * (max - min);
                ev.target.value = val;
                ev.target.dispatchEvent(new CustomEvent('input'));
            });
        });
    }

}
