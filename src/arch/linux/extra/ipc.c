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

#include <stdlib.h>
#include <unistd.h>

#include "ipc.h"

struct priv_ipc_t {
    ipc_conf_t conf;
    void*      buf;
};

static void ipc_free_buf(ipc_t *ipc)
{
    if (ipc->buf) {
        free(ipc->buf);
        ipc->buf = NULL;
    }
}

ipc_t* ipc_init(const ipc_conf_t *conf)
{
    ipc_t *ipc = malloc(sizeof(ipc_t));
    ipc->conf.fd_r = conf->fd_r;
    ipc->conf.fd_w = conf->fd_w;
    ipc->buf = NULL;
    return ipc;
}

void ipc_destroy(ipc_t *ipc)
{
    ipc_free_buf(ipc);
    free(ipc);
}

int ipc_read(ipc_t *ipc, tlv_t *packet)
{
    if (read(ipc->conf.fd_r, &packet->t, sizeof(packet->t)) != sizeof(packet->t)) {
        return -1;
    }
    if (read(ipc->conf.fd_r, &packet->l, sizeof(packet->l)) != sizeof(packet->l)) {
        return -1;
    }
    ipc_free_buf(ipc);
    if (packet->l > 0) {
        ipc->buf = malloc(packet->l);

        if (read(ipc->conf.fd_r, ipc->buf, packet->l) != packet->l) {
            return -1;
        }
        
        packet->v = ipc->buf;
    }
    return 0;
}

int ipc_write(const ipc_t *ipc, const tlv_t *packet)
{
    if (write(ipc->conf.fd_w, &packet->t, sizeof(packet->t)) == -1) {
        return -1;
    }
    if (write(ipc->conf.fd_w, &packet->l, sizeof(packet->l)) == -1) {
        return -1;
    }
    if ((packet->l > 0) && (write(ipc->conf.fd_w, packet->v, packet->l) == -1)) {
        return -1;
    }
    return 0;
}

const ipc_conf_t* ipc_get_config(const ipc_t *ipc)
{
    return &ipc->conf;
}
