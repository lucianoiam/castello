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

#ifndef PROXYWEBUI_HPP
#define PROXYWEBUI_HPP

#include "DistrhoUI.hpp"

#include <vector>

#ifdef DISTRHO_OS_LINUX
#include "arch/linux/ExternalGtkWebWidget.hpp"
#endif
#ifdef DISTRHO_OS_MAC
#include "arch/macos/CocoaWebWidget.hpp"
#endif
#ifdef DISTRHO_OS_WINDOWS
#include "arch/windows/EdgeWebWidget.hpp"
#endif

START_NAMESPACE_DISTRHO

class ProxyWebUI : public UI, private WebWidgetEventHandler
{
public:
    ProxyWebUI(uint baseWidth = 0, uint baseHeight = 0, uint32_t backgroundColor = 0xffffffff);
    virtual ~ProxyWebUI() {};

protected:

    void onDisplay() override;

    void parameterChanged(uint32_t index, float value) override;
#if (DISTRHO_PLUGIN_WANT_STATE == 1)
    void stateChanged(const char* key, const char* value) override;
#endif

    PlatformWebWidget& webWidget() { return fWebWidget; }

    void webPostMessage(const ScriptValueVector& args);

    void flushInitMessageQueue();

    virtual void webContentReady() {};
    virtual void webMessageReceived(const ScriptValueVector& args) { (void)args; };

private:
    // WebWidgetEventHandler

    virtual void handleWebWidgetContentLoadFinished() override;
    virtual void handleWebWidgetScriptMessageReceived(const ScriptValueVector& args) override;

    typedef std::vector<ScriptValueVector> InitMessageQueue;

    PlatformWebWidget fWebWidget;
    uint32_t          fBackgroundColor;
    bool              fDisplayed;
    bool              fInitContentReady;
    InitMessageQueue  fInitMsgQueue;

};

END_NAMESPACE_DISTRHO

#endif  // PROXYWEBUI_HPP
