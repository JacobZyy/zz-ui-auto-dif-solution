const remRegex = /(\d+(?:\.\d+)?|\.\d+)rem/gi

function test(value: string) {
  value.replace(remRegex, (_match, remValue) => {
    const convertedRemValue = Number(remValue)
    console.log('🚀 ~ test ~ convertedRemValue:', convertedRemValue)
    return remValue
  })
}

const list = [
  '1rem',
  '2.375rem',
  '.42rem',
  '0 0 .42rem',
  '0 .42rem 0 .375rem',
]

list.forEach((item) => {
  test(item)
})
