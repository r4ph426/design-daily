import { SubmissionRateLimit } from "../../submission-worker/rate-limit.js";

export function memoryRateLimit() {
  const objects = new Map();
  return {
    idFromName: (name) => name,
    get(name) {
      if (!objects.has(name)) {
        const values = new Map();
        let tail = Promise.resolve();
        const storage = {
          async get(key) { await new Promise((resolve) => setTimeout(resolve, 1)); return values.get(key); },
          async put(key, value) { values.set(key, value); },
          async setAlarm() {},
          async deleteAll() { values.clear(); },
          transaction(callback) {
            const result = tail.then(() => callback(storage));
            tail = result.catch(() => {});
            return result;
          },
        };
        const object = new SubmissionRateLimit({ storage });
        objects.set(name, { fetch: (url, options) => object.fetch(new Request(url, options)) });
      }
      return objects.get(name);
    },
  };
}
