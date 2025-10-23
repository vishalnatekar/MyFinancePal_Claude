require("@testing-library/jest-dom");

// Polyfill encoders required by undici in the Jest environment
const { TextDecoder, TextEncoder } = require("util");
const {
	setTimeout: nodeSetTimeout,
	setInterval: nodeSetInterval,
	clearTimeout: nodeClearTimeout,
	clearInterval: nodeClearInterval,
} = require("timers");

if (!global.TextEncoder) {
	global.TextEncoder = TextEncoder;
}

if (!global.TextDecoder) {
	// @ts-ignore - TextDecoder constructor signature mismatch is acceptable for tests
	global.TextDecoder = TextDecoder;
}

const {
	ReadableStream,
	WritableStream,
	TransformStream,
} = require("stream/web");

if (!global.ReadableStream) {
	global.ReadableStream = ReadableStream;
}

if (!global.WritableStream) {
	global.WritableStream = WritableStream;
}

if (!global.TransformStream) {
	global.TransformStream = TransformStream;
}

if (global.setTimeout !== nodeSetTimeout) {
	global.setTimeout = nodeSetTimeout;
	global.clearTimeout = nodeClearTimeout;
	global.setInterval = nodeSetInterval;
	global.clearInterval = nodeClearInterval;

	if (global.window) {
		global.window.setTimeout = nodeSetTimeout;
		global.window.clearTimeout = nodeClearTimeout;
		global.window.setInterval = nodeSetInterval;
		global.window.clearInterval = nodeClearInterval;
	}
}

const { MessageChannel, MessagePort } = require("worker_threads");

if (!global.MessagePort) {
	global.MessagePort = MessagePort;
}

if (!global.MessageChannel) {
	global.MessageChannel = MessageChannel;
}

// Provide fetch polyfill for API route tests
const { fetch, Headers, Request, Response } = require("undici");

if (!global.fetch) {
	global.fetch = fetch;
}

if (!global.Headers) {
	global.Headers = Headers;
}

if (!global.Request) {
	global.Request = Request;
}

if (!global.Response) {
	global.Response = Response;
}

// Mock Next.js router
jest.mock("next/navigation", () => ({
	useRouter() {
		return {
			push: jest.fn(),
			replace: jest.fn(),
			prefetch: jest.fn(),
			back: jest.fn(),
			forward: jest.fn(),
			refresh: jest.fn(),
		};
	},
	useSearchParams() {
		return new URLSearchParams();
	},
	usePathname() {
		return "";
	},
}));

// Supabase mocks will be handled in individual test files

// Mock environment variables
