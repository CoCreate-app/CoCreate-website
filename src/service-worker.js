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

// Commercial Licensing Information:
// For commercial use of this software without the copyleft provisions of the AGPLv3,
// you must obtain a commercial license from CoCreate LLC.
// For details, visit <https://cocreate.app/licenses/> or contact us at sales@cocreate.app.

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

    if (!storage) {
        console.log('storage:', storage);

        const url = new URL(e.request.url);
        const hostname = url.host;
        const pathname = url.pathname;

        let file = await readFile({
            database: '5ff747727005da1c272740ab',
            array: 'files',
            filter: {
                path: hostname,
                host: '*'
            }
        });

        if (file) {
            console.log('file:', file);
            console.log('Pathname:', pathname);
            console.log('file', file)
        }

        if (file && file.object && file.object[0]) {
            file = file.object[0]

            const modifiedRequest = new Request(e.request, {
                headers: new Headers({
                    'File-Content': file.src,
                    'Content-Type': file['content-type']
                })
            });
            e.request = modifiedRequest
        }
    }

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


function readFile(data) {
    return new Promise((resolve) => {
        const request = indexedDB.open(data.database);

        request.onsuccess = function () {
            const db = request.result
            console.log('readFile', data)
            try {
                const transaction = db.transaction(data.array, "readonly");
                const objectStore = transaction.objectStore(data.array);
                const cursorRequest = objectStore.openCursor();

                cursorRequest.onsuccess = function () {
                    const cursor = cursorRequest.result;
                    if (cursor) {
                        const file = cursor.value;
                        if (!file || !file.src || !file.path || !file.host)
                            cursor.continue();
                        else if (file.path !== data.filter.path || !file.host.includes(data.filter.host))
                            cursor.continue();
                        else {
                            db.close()
                            return resolve(file);
                        }
                    } else {
                        // Resolve the Promise when cursor is finished
                        db.close()
                        resolve();
                    }
                };

                cursorRequest.onerror = function () {
                    console.error("Cursor error:", cursorRequest.error);
                    db.close()
                    resolve();
                };
            } catch (error) {

            }

        };

        request.onerror = function (event) {
            reject(event.target.error);
        };

    })
}

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
