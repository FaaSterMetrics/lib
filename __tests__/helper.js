/* eslint-env jest */
const helper = require('../helper')

test('isLambda', () => {
  expect(helper.isLambda).toBe(false)
})

test('isGoogle', () => {
  expect(helper.isGoogle).toBe(false)
})

test('prefix', () => {
  expect(helper.prefix()).toBeNull()
})

test('getFnName', () => {
  expect(helper.getFnName()).toBe('unknownFnName')
})
