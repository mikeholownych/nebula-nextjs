import '@testing-library/jest-dom'
import { TextDecoder, TextEncoder } from 'util'
import { deserialize, serialize } from 'v8'
import {
  ReadableStream,
  TextDecoderStream,
  TextEncoderStream,
  TransformStream,
  WritableStream,
} from 'stream/web'

// React 19 removed react-dom/test-utils.act — shim it so @testing-library/react works.
// https://github.com/testing-library/react-testing-library/issues/1375
import { act } from 'react'
;(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true
// eslint-disable-next-line @typescript-eslint/no-require-imports
const reactDomTestUtils = require('react-dom/test-utils') as Record<string, unknown>
if (!reactDomTestUtils['act']) {
  reactDomTestUtils['act'] = act
}

if (!globalThis.TextEncoder) globalThis.TextEncoder = TextEncoder
if (!globalThis.TextDecoder) globalThis.TextDecoder = TextDecoder as typeof globalThis.TextDecoder
if (!globalThis.structuredClone) {
  globalThis.structuredClone = ((value: unknown) => deserialize(serialize(value))) as typeof globalThis.structuredClone
}
if (!globalThis.ReadableStream) globalThis.ReadableStream = ReadableStream as typeof globalThis.ReadableStream
if (!globalThis.WritableStream) globalThis.WritableStream = WritableStream as typeof globalThis.WritableStream
if (!globalThis.TransformStream) globalThis.TransformStream = TransformStream as typeof globalThis.TransformStream
if (!globalThis.TextEncoderStream) globalThis.TextEncoderStream = TextEncoderStream as typeof globalThis.TextEncoderStream
if (!globalThis.TextDecoderStream) globalThis.TextDecoderStream = TextDecoderStream as typeof globalThis.TextDecoderStream

const {
  Headers: EdgeHeaders,
  Request: EdgeRequest,
  Response: EdgeResponse,
} = require('next/dist/compiled/@edge-runtime/primitives') as {
  Headers: typeof globalThis.Headers
  Request: typeof globalThis.Request
  Response: typeof globalThis.Response
}

if (!globalThis.Headers) globalThis.Headers = EdgeHeaders
if (!globalThis.Request) globalThis.Request = EdgeRequest
if (!globalThis.Response) globalThis.Response = EdgeResponse
