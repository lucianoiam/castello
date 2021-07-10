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

class CastelloRevUI extends DISTRHO_UI {

    constructor() {
        super();

        // Add a connectToParameter() method to some widgets, definition below.
        ParameterControlTrait.apply(RangeInputWidget, [this]);

        // Connect feedback knob
        widget('p-feedback').connectToParameter(0);

        // Connect LPF cutoff frequency knob
        widget('p-lpfreq').connectToParameter(1);

        // Connect resize handle
        widget('resize').addEventListener('input', (ev) => {
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
            widget('resize').opt.minWidth = await this.getInitWidth() / k;
            widget('resize').opt.minHeight = await this.getInitHeight() / k;
        }) ();

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

}


/**
 * Support code for writing less widget handling code
 */

function widget(id) {
    return document.getElementById(id);
}

function ParameterControlTrait(ui) {
    this.prototype.connectToParameter = function(index) {
        this.addEventListener('input', (ev) => {
            ui.setParameterValue(index, ev.target.value);
        });
    }
}
