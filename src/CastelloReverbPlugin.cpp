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

#include <string>
#include <unordered_map>

#include "DistrhoPlugin.hpp"
#include "DistrhoPluginInfo.h"

extern "C" {
#include "dsp/soundpipe.h"
}

#define PARAMETER_COUNT 2
#define PROGRAM_COUNT   0
#define STATE_COUNT     1

START_NAMESPACE_DISTRHO

// FIXME - this is still a very naive implementation, turning on/off the plugin
//         produces clicks, dry/wet control is lacking, lpfreq range is not
//         very useful, parameters need better names, and so on...

class CastelloReverbPlugin : public Plugin
{
public:
    CastelloReverbPlugin() : Plugin(PARAMETER_COUNT, PROGRAM_COUNT, STATE_COUNT)
    {
        sp_create(&fSoundpipe);
        sp_revsc_create(&fReverb);
        sp_revsc_init(fSoundpipe, fReverb);
    }

    ~CastelloReverbPlugin()
    {
        sp_revsc_destroy(&fReverb);
        sp_destroy(&fSoundpipe);
    }

    const char* getLabel() const override
    {
        return DISTRHO_PLUGIN_NAME;
    }

    const char* getMaker() const override
    {
        return "Luciano Iam";
    }

    const char* getLicense() const override
    {
        return "ISC";
    }

    uint32_t getVersion() const override
    {
        return 0;
    }

    int64_t getUniqueId() const override
    {
        return d_cconst('L', 'I', 'c', 'r');
    }

    void initParameter(uint32_t index, Parameter& parameter) override
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

    float getParameterValue(uint32_t index) const override
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

    void setParameterValue(uint32_t index, float value) override
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

    void initState(uint32_t index, String& stateKey, String& defaultStateValue) override
    {
        switch (index)
        {
        case 0:
            stateKey = "ui_size";
            break;
        }

        defaultStateValue = "";
    }

    void setState(const char* key, const char* value) override
    {
        fState[key] = value;
    }

    String getState(const char* key) const override
    {
        StateMap::const_iterator it = fState.find(key);
        if (it == fState.end()) {
            return String();
        }
        
        return String(it->second.c_str());
    }

    void run(const float** inputs, float** outputs, uint32_t frames) override
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

private:
    sp_data*  fSoundpipe;
    sp_revsc* fReverb;

    typedef std::unordered_map<std::string,std::string> StateMap;

    StateMap fState;

};

Plugin* createPlugin()
{
    return new CastelloReverbPlugin;
}

END_NAMESPACE_DISTRHO
