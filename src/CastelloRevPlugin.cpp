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

// FIXME - this is still a very naive implementation, turning on/off the plugin
//         produces clicks, dry/wet control is lacking, lpfreq range is not
//         very useful, parameters need better names, and so on...

CastelloRevPlugin::CastelloRevPlugin()
    : Plugin(2 /* parameterCount */, 0 /* programCount */, 1 /* stateCount */)
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
        parameter.ranges.max = 10000.f;  // TODO
        parameter.ranges.def = 4000.f;
        break;
    }

    // TODO - are defaults set somewhere? can this be omitted by using programs?
    setParameterValue(index, parameter.ranges.def);
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

    return 0;
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

void CastelloRevPlugin::initState(uint32_t index, String& stateKey, String& defaultStateValue)
{
    switch (index)
    {
    case 0:
        stateKey = "ui_size";
        break;
    }

    defaultStateValue = "";
}

void CastelloRevPlugin::setState(const char* key, const char* value)
{
    fState[key] = value;
}

String CastelloRevPlugin::getState(const char* key) const
{
    StateMap::const_iterator it = fState.find(key);
    if (it == fState.end()) {
        return String();
    }
    
    return String(it->second.c_str());
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
