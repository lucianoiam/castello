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

#include "CastelloRevPlugin.hpp"

USE_NAMESPACE_DISTRHO

Plugin* DISTRHO::createPlugin()
{
    return new CastelloRevPlugin;
}

CastelloRevPlugin::CastelloRevPlugin()
    : Plugin(0 /* parameterCount */, 0 /* programCount */, 0 /* stateCount */)
{
    sp_create(&fSoundpipe);
    sp_revsc_create(&fReverb);
    sp_revsc_init(fSoundpipe, fReverb);

    // FIXME - for testing
    fReverb->feedback = 0.9f;
    fReverb->lpfreq = 4000.f;
}

CastelloRevPlugin::~CastelloRevPlugin()
{
    sp_revsc_destroy(&fReverb);
    sp_destroy(&fSoundpipe);
}

void CastelloRevPlugin::initParameter(uint32_t index, Parameter& parameter)
{
    // unused
    (void)index;
    (void)parameter;
}

float CastelloRevPlugin::getParameterValue(uint32_t index) const
{
    return 0;

    // unused
    (void)index;
}

void CastelloRevPlugin::setParameterValue(uint32_t index, float value)
{
    // unused
    (void)index;
    (void)value;
}

void CastelloRevPlugin::run(const float** inputs, float** outputs, uint32_t frames)
{
    float* inpL = (float *)inputs[0];
    float* inpR = (float *)inputs[1];
    float* outL = outputs[0];
    float* outR = outputs[1];

    for (uint32_t offset = 0; offset < frames; offset++) {
        sp_revsc_compute(fSoundpipe, fReverb, inpL + offset, inpR + offset,
                                                outL + offset, outR + offset);
    }
}
