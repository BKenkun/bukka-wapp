import { describe, it, expect } from 'vitest'
import { cn } from '@/lib/utils'

describe('cn (className merge utility)', () => {
  it('should merge simple class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('should handle conditional classes', () => {
    expect(cn('base', true && 'active')).toBe('base active')
    expect(cn('base', false && 'active')).toBe('base')
  })

  it('should merge tailwind classes correctly', () => {
    // Later classes should override earlier ones
    expect(cn('p-4', 'p-2')).toBe('p-2')
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
  })

  it('should handle arrays of classes', () => {
    expect(cn(['foo', 'bar'], 'baz')).toBe('foo bar baz')
  })

  it('should handle objects with boolean values', () => {
    expect(cn({ active: true, disabled: false })).toBe('active')
  })

  it('should filter out falsy values', () => {
    expect(cn('foo', null, undefined, '', 'bar')).toBe('foo bar')
  })

  it('should handle complex combinations', () => {
    const result = cn(
      'base-class',
      true && 'conditional',
      { active: true, hidden: false },
      ['array', 'classes']
    )
    expect(result).toBe('base-class conditional active array classes')
  })

  it('should handle empty arguments', () => {
    expect(cn()).toBe('')
  })
})
