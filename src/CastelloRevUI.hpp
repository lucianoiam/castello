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

#ifndef CASTELLOREVUI_HPP
#define CASTELLOREVUI_HPP

#include "base/ProxyWebUI.hpp"

START_NAMESPACE_DISTRHO

class CastelloRevUI : public ProxyWebUI
{
public:
    CastelloRevUI();
    ~CastelloRevUI() {};

    void uiReshape(uint width, uint height) override;
    void stateChanged(const char* key, const char* value) override;

};

END_NAMESPACE_DISTRHO

#endif  // CASTELLOREVUI_HPP
