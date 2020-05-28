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

test('prefix lambda', () => {
  jest.resetModules()
  process.env.AWS_LAMBDA_FUNCTION_NAME = 'test'
  const helper2 = require('../helper')
  expect(helper2.prefix()).toBe('/:fn')
})
