/*
 * dpf-webui
 * Copyright (C) 2021 Luciano Iam <oss@lucianoiam.com>
 *
 * Permission to use, copy, modify, and/or distribute this software for any purpose with
 * or without fee is hereby granted, provided that the above copyright notice and this
 * permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD
 * TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN
 * NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL
 * DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER
 * IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN
 * CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 */

#ifndef IPC_H
#define IPC_H

typedef struct priv_ipc_t ipc_t;

typedef struct {
    int fd_r;
    int fd_w;
} ipc_conf_t;

typedef struct {
    short       t;
    int         l;
    const void* v;
} tlv_t;

#ifdef __cplusplus
extern "C" {
#endif

ipc_t*            ipc_init(const ipc_conf_t *conf);
void              ipc_destroy(ipc_t *ipc);
int               ipc_read(ipc_t *ipc, tlv_t *packet);
int               ipc_write(const ipc_t *ipc, const tlv_t *packet);
const ipc_conf_t* ipc_get_config(const ipc_t *ipc);

#ifdef __cplusplus
}
#endif

#endif  // IPC_H
