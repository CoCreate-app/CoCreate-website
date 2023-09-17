/********************************************************************************
 * Copyright (C) 2023 CoCreate and Contributors.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 ********************************************************************************/

/**
 * Commercial Licensing Information:
 * For commercial use of this software without the copyleft provisions of the AGPLv3,
 * you must obtain a commercial license from CoCreate LLC.
 * For details, visit <https://cocreate.app/licenses/> or contact us at sales@cocreate.app.
 */

const cacheName = "dynamic-v2";
let organization_id = ""
let storage = true

const queryString = self.location.search;
const queryParams = new URLSearchParams(queryString);
let cacheType = queryParams.get('cache');

self.addEventListener("install", (e) => {
    console.log('Service Worker Installing')
    self.skipWaiting();
});

self.addEventListener("activate", async (e) => {
    e.waitUntil(clients.claim());
});

self.addEventListener("fetch", async (e) => {
    if (!(e.request.url.indexOf('http') === 0) || e.request.method === 'POST') return;

    e.respondWith(
        caches
            .match(e.request)
            .then(async (cacheResponse) => {
                if (!navigator.onLine && !!cacheResponse && cacheType !== 'false') {
                    return cacheResponse;
                } else {
                    const networkResponse = await fetch(e.request);

                    if (!organization_id)
                        organization_id = networkResponse.headers.get('organization')

                    let storageHeader = networkResponse.headers.get('storage')
                    if (storageHeader)
                        storage = storageHeader

                    if (!cacheResponse || cacheType === 'false' || cacheType === 'offline') {
                        return networkResponse.clone();
                    }

                    if (cacheType && cacheType !== 'false') {
                        console.log('caching')

                        caches.open(cacheName).then((cache) => {
                            if (networkResponse.status !== 206 && networkResponse.status !== 502) {
                                cache.put(e.request, networkResponse);
                                if (cacheType === 'reload' || cacheType === 'prompt') {
                                    const networkModified = networkResponse.headers.get('last-modified');
                                    const cacheModified = cacheResponse.headers.get('last-modified');
                                    if (networkModified !== cacheModified) {
                                        self.clients.matchAll().then((clients) => {
                                            clients.forEach((client) => {
                                                client.postMessage({ action: 'cacheType', cacheType }); // Send a custom message
                                                console.log(`file ${cacheType} has been triggered`)
                                            });
                                        });
                                    }
                                }
                            }
                        }).catch(() => {

                        });
                    }

                }

                if (!!cacheResponse && cacheType !== 'false' && cacheType !== 'offline') {
                    return cacheResponse;
                }

            })
            .catch(function () {
                return caches.match('./offline.html');
            })
    );
});

self.addEventListener('message', function (event) {
    if (event.data === 'getOrganization')
        event.source.postMessage(organization_id);
});

// self.addEventListener('backgroundfetchsuccess', (event) => {
//     const bgFetch = event.registration;

//     event.waitUntil(async function() {
//       // Create/open a cache.
//       const cache = await caches.open(cacheName);
//       // Get all the records.
//       const records = await bgFetch.matchAll();
//       // Copy each request/response across.
//       const promises = records.map(async (record) => {
//         const response = await record.responseReady;
//         console.log('putting ')
//         await cache.put(record.request, response);
//       });

//       // Wait for the copying to complete
//       await Promise.all(promises);

//       // Update the progress notification.
//     //   event.updateUI({ title: 'Episode 5 ready to listen!' });
//     }());
//   });
