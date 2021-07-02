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

#ifndef HELPER_H
#define HELPER_H

#include <stdint.h>

typedef enum {
    OPC_SET_BACKGROUND_COLOR,
    OPC_SET_PARENT,
    OPC_SET_SIZE,
    OPC_NAVIGATE,
    OPC_RUN_SCRIPT,
    OPC_INJECT_SCRIPT,
    OPC_KEY_EVENT,
    OPC_HANDLE_SCRIPT_MESSAGE,
    OPC_HANDLE_LOAD_FINISHED
} helper_opcode_t;

typedef enum {
    ARG_TYPE_NULL,
    ARG_TYPE_FALSE,
    ARG_TYPE_TRUE,
    ARG_TYPE_DOUBLE,
    ARG_TYPE_STRING
} helper_msg_arg_type_t;

typedef struct {
    unsigned width;
    unsigned height;
} helper_size_t;

typedef enum {
    MOD_SHIFT   = 1 << 0,
    MOD_CONTROL = 1 << 1,
    MOD_ALT     = 1 << 2,
    MOD_SUPER   = 1 << 3
} helper_key_mod_t;

typedef struct {
    char     press;
    unsigned code;
    unsigned hw_code;
    unsigned mod;
} helper_key_t;

#endif  // HELPER_H
