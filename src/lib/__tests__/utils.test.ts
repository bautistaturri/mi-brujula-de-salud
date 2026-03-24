import { describe, it, expect } from 'vitest'
import { calcularSemaforo, iemLabel, scoreRiesgoLabel, formatFechaCorta } from '../utils'

describe('calcularSemaforo', () => {
  it('devuelve verde con IEM>=5 y conductas>=4', () => {
    expect(calcularSemaforo(5, 4)).toBe('verde')
    expect(calcularSemaforo(7, 5)).toBe('verde')
    expect(calcularSemaforo(5, 5)).toBe('verde')
    expect(calcularSemaforo(6, 4)).toBe('verde')
  })

  it('devuelve rojo con IEM<=2 (sin importar las conductas)', () => {
    expect(calcularSemaforo(2, 5)).toBe('rojo')
    expect(calcularSemaforo(1, 5)).toBe('rojo')
    expect(calcularSemaforo(2, 4)).toBe('rojo')
  })

  it('devuelve rojo con conductas<=1 (sin importar el IEM)', () => {
    expect(calcularSemaforo(6, 1)).toBe('rojo')
    expect(calcularSemaforo(7, 0)).toBe('rojo')
    expect(calcularSemaforo(5, 1)).toBe('rojo')
  })

  it('devuelve rojo cuando ambos están en zona crítica', () => {
    expect(calcularSemaforo(1, 0)).toBe('rojo')
    expect(calcularSemaforo(2, 1)).toBe('rojo')
  })

  it('devuelve amarillo en casos intermedios', () => {
    expect(calcularSemaforo(3, 3)).toBe('amarillo')
    expect(calcularSemaforo(4, 2)).toBe('amarillo')
    expect(calcularSemaforo(4, 4)).toBe('amarillo') // IEM 4 < 5, no llega a verde
    expect(calcularSemaforo(5, 3)).toBe('amarillo') // conductas 3 < 4, no llega a verde
  })

  it('maneja valores extremos sin lanzar excepciones', () => {
    expect(() => calcularSemaforo(0, 0)).not.toThrow()
    expect(() => calcularSemaforo(7, 5)).not.toThrow()
    expect(() => calcularSemaforo(1, 0)).not.toThrow()
  })
})

describe('iemLabel', () => {
  it('devuelve la etiqueta correcta para cada valor', () => {
    expect(iemLabel(1)).toBe('Sin energía')
    expect(iemLabel(2)).toBe('Muy bajo')
    expect(iemLabel(3)).toBe('Bajo')
    expect(iemLabel(4)).toBe('Moderado')
    expect(iemLabel(5)).toBe('Bien')
    expect(iemLabel(6)).toBe('Muy bien')
    expect(iemLabel(7)).toBe('Excelente')
  })

  it('devuelve string vacío para valores fuera de rango', () => {
    expect(iemLabel(0)).toBe('')
    expect(iemLabel(8)).toBe('')
  })
})

describe('scoreRiesgoLabel', () => {
  it('devuelve Alto para score >= 60', () => {
    expect(scoreRiesgoLabel(60).label).toBe('Alto')
    expect(scoreRiesgoLabel(100).label).toBe('Alto')
  })

  it('devuelve Medio para score entre 30 y 59', () => {
    expect(scoreRiesgoLabel(30).label).toBe('Medio')
    expect(scoreRiesgoLabel(59).label).toBe('Medio')
  })

  it('devuelve Bajo para score < 30', () => {
    expect(scoreRiesgoLabel(0).label).toBe('Bajo')
    expect(scoreRiesgoLabel(29).label).toBe('Bajo')
  })
})
