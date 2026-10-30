import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";
const compiled = ts.transpileModule(await readFile(new URL("../src/features/admin/support-inbox.ts", import.meta.url), "utf8"), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
}).outputText;
const { supportQuery, supportHref, supportStatusEvent, mergeSupportMessages } = await import("data:text/javascript;base64," + Buffer.from(compiled).toString("base64"));

test("support selection never leaks into queue requests, and trash only sends supported filters", () => {
  const params = new URLSearchParams("ticket=one&search=Olena&page=3&view=unread&status=OPEN&kind=RETURN&orderId=order&unknown=x");
  assert.deepEqual(Object.fromEntries(supportQuery(params)), { search: "Olena", page: "3", status: "OPEN", kind: "RETURN", view: "unread", orderId: "order" });
  assert.deepEqual(Object.fromEntries(supportQuery(params, true)), { search: "Olena", page: "3" });
});

test("opening and closing a conversation preserves queue filters, search, pagination and browser links", () => {
  const params = new URLSearchParams("search=headphones&page=2&view=open");
  const opened = supportHref(params, { ticket: "one" });
  assert.equal(opened, "/admin/support?search=headphones&page=2&view=open&ticket=one");
  const query = new URL(opened, "https://fixture.test").searchParams;
  assert.equal(supportHref(query, { ticket: null }), "/admin/support?search=headphones&page=2&view=open");
  assert.equal(supportHref(new URLSearchParams(), { ticket: "two" }, true), "/admin/support/trash?ticket=two");
  assert.equal(supportHref(query, { ticket: null, search: null, view: null, page: null }), "/admin/support");
});

test("only exact status events are localized; ordinary customer messages stay intact", () => {
  assert.deepEqual(supportStatusEvent("IN_PROGRESS → CLOSED"), ["IN_PROGRESS", "CLOSED"]);
  for (const text of ["Please leave OPEN → CLOSED unchanged", "OPEN → UNKNOWN", "<b>OPEN → CLOSED</b>", "My message"])
    assert.equal(supportStatusEvent(text), null);
});

test("polling and older message pages merge chronologically without duplicate messages or stale copies", () => {
  const message = (id, createdAt, text = id) => ({ id, createdAt, message: text });
  const older = [message("a", "2026-10-28T10:00:00Z"), message("b", "2026-10-29T10:00:00Z", "stale")];
  const latest = [message("c", "2026-10-29T10:00:00Z"), message("b", "2026-10-29T10:00:00Z", "fresh")];
  const merged = mergeSupportMessages(older, latest);
  assert.deepEqual(merged.map(value => value.id), ["a", "b", "c"]);
  assert.equal(merged[1].message, "fresh");
  assert.equal(older[1].message, "stale");
});
