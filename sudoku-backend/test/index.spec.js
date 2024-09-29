"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// test/index.spec.ts
const cloudflare_test_1 = require("cloudflare:test");
const vitest_1 = require("vitest");
const index_1 = __importDefault(require("../src/index"));
// For now, you'll need to do something like this to get a correctly-typed
// `Request` to pass to `worker.fetch()`.
const IncomingRequest = (Request);
(0, vitest_1.describe)('Hello World worker', () => {
    (0, vitest_1.it)('responds with Hello World! (unit style)', () => __awaiter(void 0, void 0, void 0, function* () {
        const request = new IncomingRequest('http://example.com');
        // Create an empty context to pass to `worker.fetch()`.
        const ctx = (0, cloudflare_test_1.createExecutionContext)();
        const response = yield index_1.default.fetch(request, cloudflare_test_1.env, ctx);
        // Wait for all `Promise`s passed to `ctx.waitUntil()` to settle before running test assertions
        yield (0, cloudflare_test_1.waitOnExecutionContext)(ctx);
        (0, vitest_1.expect)(yield response.text()).toMatchInlineSnapshot(`"Hello World!"`);
    }));
    (0, vitest_1.it)('responds with Hello World! (integration style)', () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield cloudflare_test_1.SELF.fetch('https://example.com');
        (0, vitest_1.expect)(yield response.text()).toMatchInlineSnapshot(`"Hello World!"`);
    }));
});
