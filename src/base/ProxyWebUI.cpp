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

#include "ProxyWebUI.hpp"

#include "base/Platform.hpp"
#include "base/macro.h"

USE_NAMESPACE_DISTRHO

// TODO - why the special case?
#ifdef DISTRHO_OS_WINDOWS
#define INIT_SCALE_FACTOR platform::getSystemDisplayScaleFactor()
#else
#define INIT_SCALE_FACTOR 1.f
#endif

ProxyWebUI::ProxyWebUI(uint baseWidth, uint baseHeight, uint32_t backgroundColor)
    : UI(INIT_SCALE_FACTOR * baseWidth, INIT_SCALE_FACTOR * baseHeight)
    , fWebWidget(getWindow())
    , fBackgroundColor(backgroundColor)
    , fInitContentReady(false)
{
    // Automatically scale up the webview so its contents do not look small
    // on high pixel density displays, known as HiDPI, Retina...
    float k = platform::getSystemDisplayScaleFactor();
    uint width = k * baseWidth;
    uint height = k * baseHeight;
    setGeometryConstraints(width, height, true);
    setSize(width, height);

    fWebWidget.setEventHandler(this);
    fWebWidget.setBackgroundColor(fBackgroundColor);
    
    String js = String(
#include "base/webui.js"
    );
    fWebWidget.injectScript(js);

    String url = "file://" + platform::getResourcePath() + "/index.html";
    fWebWidget.navigate(url);
}

void ProxyWebUI::onDisplay()
{
#ifdef DGL_OPENGL
    // Clear background for OpenGL
    glClearColor(DISTRHO_UNPACK_RGBA_NORM(fBackgroundColor, GLfloat));
    glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
#endif
#ifdef DGL_CAIRO
    // Clear background for Cairo
    cairo_t* cr = ((CairoGraphicsContext&)getWindow().getGraphicsContext()).handle;
    cairo_set_source_rgba(cr, DISTRHO_UNPACK_RGBA_NORM(fBackgroundColor, double));
    cairo_paint(cr);
#endif
}

void ProxyWebUI::parameterChanged(uint32_t index, float value)
{
    webPostMessage({"WebUI", "parameterChanged", index, value});
}

#if (DISTRHO_PLUGIN_WANT_STATE == 1)

void ProxyWebUI::stateChanged(const char* key, const char* value)
{
    webPostMessage({"WebUI", "stateChanged", key, value});
}

#endif // DISTRHO_PLUGIN_WANT_STATE == 1

void ProxyWebUI::webPostMessage(const ScriptValueVector& args) {
    if (fInitContentReady) {
        fWebWidget.postMessage(args);
    } else {
        fInitMsgQueue.push_back(args);
    }
}

void ProxyWebUI::flushInitMessageQueue()
{
    for (InitMessageQueue::iterator it = fInitMsgQueue.begin(); it != fInitMsgQueue.end(); ++it) {
        fWebWidget.postMessage(*it);
    }
    
    fInitMsgQueue.clear();
}

void ProxyWebUI::handleWebWidgetContentLoadFinished()
{
    fInitContentReady = true;
    webContentReady();
}

void ProxyWebUI::handleWebWidgetScriptMessageReceived(const ScriptValueVector& args)
{
    if (args[0].getString() != "WebUI") {
        webMessageReceived(args); // passthrough
        return;
    }

    String method = args[1].getString();
    int argc = args.size() - 2;

    if (method == "flushInitMessageQueue") {
        flushInitMessageQueue();

    } else if ((method == "editParameter") && (argc == 2)) {
        editParameter(
            static_cast<uint32_t>(args[2].getDouble()), // index
            static_cast<bool>(args[3].getBool())        // started
        );

    } else if ((method == "setParameterValue") && (argc == 2)) {
        setParameterValue(
            static_cast<uint32_t>(args[2].getDouble()), // index
            static_cast<float>(args[3].getDouble())     // value
        );

#if (DISTRHO_PLUGIN_WANT_STATE == 1)
    } else if ((method == "setState") && (argc == 2)) {
        setState(
            args[2].getString(), // key
            args[3].getString()  // value
        );
#endif // DISTRHO_PLUGIN_WANT_STATE == 1

    } else {
        DISTRHO_LOG_STDERR_COLOR("Invalid call to ProxyWebUI method");
    }
}