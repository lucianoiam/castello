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
    : Plugin(2 /* parameterCount */, 0 /* programCount */, 0 /* stateCount */)
{
    sp_create(&fSoundpipe);
    sp_revsc_create(&fReverb);
    sp_revsc_init(fSoundpipe, fReverb);
}

CastelloRevPlugin::~CastelloRevPlugin()
{
    sp_revsc_destroy(&fReverb);
    sp_destroy(&fSoundpipe);
}

void CastelloRevPlugin::initParameter(uint32_t index, Parameter& parameter)
{
    parameter.hints = kParameterIsAutomable;

    switch (index)
    {
    case 0:
        parameter.name = "feedback";
        parameter.ranges.min = 0.f;
        parameter.ranges.max = 1.f;
        parameter.ranges.def = 0.5f;
        break;
    case 1:
        parameter.name = "lpfreq";
        parameter.ranges.min = 0.f;    // TODO
        parameter.ranges.max = 8000.f;  // TODO
        parameter.ranges.def = 4000.f;
        break;
    }
}

float CastelloRevPlugin::getParameterValue(uint32_t index) const
{
    switch (index)
    {
    case 0:
        return fReverb->feedback;
    case 1:
        return fReverb->lpfreq;
    }
}

void CastelloRevPlugin::setParameterValue(uint32_t index, float value)
{
    switch (index)
    {
    case 0:
        fReverb->feedback = value;
        break;
    case 1:
        fReverb->lpfreq = value;
        break;
    }
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
