/*
 * Castello Reverb
 * Copyright (C) 2021-2022 Luciano Iam <oss@lucianoiam.com>
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

#define LOG_2     0.69314718056f
#define LOG_400   5.99146454711f
#define LOG_10000 9.21034037198f

START_NAMESPACE_DISTRHO

enum ParameterIndex {
    kParameterMix,
    kParameterSize,
    kParameterBrightness
};

class CastelloReverbPlugin : public Plugin
{
public:
    CastelloReverbPlugin()
        : Plugin(3 /*parameters*/, 0 /*programs*/, 1 /*states*/)
        , fSoundpipe(0)
        , fReverb(0)
        , fMix(0)
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
        return "GPLv3";
    }

    uint32_t getVersion() const override
    {
        return d_version(1, 1, 0);
    }

    int64_t getUniqueId() const override
    {
        return d_cconst('L', 'I', 'c', 'r');
    }

    void initParameter(uint32_t index, Parameter& parameter) override
    {
        parameter.hints = kParameterIsAutomatable;

        switch (index)
        {
        case kParameterMix:
            parameter.name = "Mix";
            parameter.symbol = "mix";
            parameter.ranges.min = 0.f;
            parameter.ranges.max = 1.f;
            parameter.ranges.def = 0.5f;
            break;
        case kParameterSize:
            parameter.name = "Size";
            parameter.symbol = "size";
            parameter.ranges.min = 0.f;
            parameter.ranges.max = 1.f;
            parameter.ranges.def = 0.33f;
            break;
        case kParameterBrightness:
            parameter.name = "Brightness";
            parameter.symbol = "brightness";
            parameter.ranges.min = 0.f;
            parameter.ranges.max = 1.f;
            parameter.ranges.def = 0.66f;
            break;
        }

        setParameterValue(index, parameter.ranges.def);
    }

    float getParameterValue(uint32_t index) const override
    {
        switch (index)
        {
        case kParameterMix:
            return fMix;
        case kParameterSize:
            return (fReverb->feedback - 0.5f) * 2.f;
        case kParameterBrightness:
            return (log(fReverb->lpfreq) - LOG_400) / (LOG_10000 - LOG_400);
        }

        return 0;
    }

    void setParameterValue(uint32_t index, float value) override
    {
        switch (index)
        {
        case kParameterMix:
            fMix = value;
            fDry = fMix < 0.5f ? 1.f : 1.f - log(fMix / 0.5f) / LOG_2;
            fWet = fMix > 0.5f ? 1.f : 1.f - log((1.f - fMix) / 0.5f) / LOG_2;
            break;
        case kParameterSize:
            fReverb->feedback = 0.5f + value / 2.f;
            break;
        case kParameterBrightness:
            fReverb->lpfreq = exp(LOG_400 + (LOG_10000 - LOG_400) * value);
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

        // inpX and outX can point to the same memory address

        for (uint32_t i = 0; i < frames; ++i) {
            float l = inpL[i];
            float r = inpR[i];
            
            sp_revsc_compute(fSoundpipe, fReverb, inpL + i, inpR + i, outL + i, outR + i);

            outL[i] = fDry * l + fWet * outL[i];
            outR[i] = fDry * r + fWet * outR[i];
        }
    }

private:
    typedef std::unordered_map<std::string,std::string> StateMap;

    sp_data*  fSoundpipe;
    sp_revsc* fReverb;
    float     fMix;
    float     fDry;
    float     fWet;
    StateMap  fState;

};

Plugin* createPlugin()
{
    return new CastelloReverbPlugin;
}

END_NAMESPACE_DISTRHO
