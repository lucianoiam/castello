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

#ifndef CASTELLO_REVERB_PLUGIN_HPP
#define CASTELLO_REVERB_PLUGIN_HPP

#include <string>
#include <unordered_map>

#include "DistrhoPlugin.hpp"
#include "DistrhoPluginInfo.h"

extern "C" {
#include "dsp/soundpipe.h"
}

START_NAMESPACE_DISTRHO

class CastelloRevPlugin : public Plugin
{
public:
    CastelloRevPlugin();
    ~CastelloRevPlugin();

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

    void  initParameter(uint32_t index, Parameter& parameter) override;
    float getParameterValue(uint32_t index) const override;
    void  setParameterValue(uint32_t index, float value) override;

    void   initState(uint32_t index, String& stateKey, String& defaultStateValue) override;
    void   setState(const char* key, const char* value) override;
    String getState(const char* key) const override;

    void  run(const float** inputs, float** outputs, uint32_t frames) override;

private:
    sp_data*  fSoundpipe;
    sp_revsc* fReverb;

    typedef std::unordered_map<std::string,std::string> StateMap;

    StateMap fState;

};

END_NAMESPACE_DISTRHO

#endif  // CASTELLO_REVERB_PLUGIN_HPP
