// One strongly consistent object per network/day. A client bucket is reserved
// separately before this one; both fail closed. Only hashes reach storage.
export class SubmissionRateLimit {
  constructor(ctx) { this.storage = ctx.storage; }

  async fetch(request) {
    const { limit, expiresAt } = await request.json();
    if (![5, 50].includes(limit) || !Number.isSafeInteger(expiresAt) || expiresAt <= Date.now()) {
      return Response.json({ allowed: false }, { status: 400 });
    }
    const allowed = await this.storage.transaction(async (txn) => {
      const count = (await txn.get("count")) || 0;
      if (count >= limit) return false;
      await txn.put("count", count + 1);
      await txn.setAlarm(expiresAt);
      return true;
    });
    return Response.json({ allowed });
  }

  async alarm() { await this.storage.deleteAll(); }
}
