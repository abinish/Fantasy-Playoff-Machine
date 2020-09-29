import * as React from 'react'

interface TextProps  {
    text: string
  }

export default function Text({ text } : TextProps) {
  return <h1>{text}</h1>
}