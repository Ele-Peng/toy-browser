function getStyle(element) {
  if (!element.style) 
    element.style = {}
  
  for (let prop in element.computedStyle) {
    const p = element.computedStyle.value
    element.style[prop] = element.computedStyle[prop].value

    if (element.style[prop].toString().match(/px$/)) {
      element.style[prop] = parseInt(element.style[prop])
    }

    if (element.style[prop].toString().match(/^[0-9\.]+$/)) {
      element.style[prop] = parseInt(element.style[prop])
    }
  }

  return element.style
}

function layout(element) {

  if (!element.computedStyle)
    return 

  const elementStyle = getStyle(element)

  if (elementStyle.display !== 'flex')
    return

  const items = element.children.filter(e => e.type === 'element')

  items.sort(function (a,b) {
    return (a.order || 0) - (b.order || 0)
  })

  let style = elementStyle

  ['width', 'height'].forEach(size => {
    if (style[size] === 'auto' || style[size] === '') {
      style[size] = null
    }
  })

  if (!style.flexDirection || style.flexDirection === 'auto')
    style.flexDirection = 'row'
  if (!style.alignItems || style.alignItems === 'auto')
    style.alignItems = 'strech'
  if (!style.justifyContent || style.justifyContent === 'auto')
    style.justifyContent = 'flex-start'
  if (!style.flexWrap || style.flexWrap === 'auto')
    style.flexWrap = 'nowrap'
  if (!style.alignContent || style.alignContent === 'auto')
    style.alignContent = 'center'

  let 
    mainSize, // 主轴size width / height
    mainStart, // 主轴起点 left / right / top / bottom
    mainEnd, // 主轴终点 left / right / top / bottom
    mainSign, // 主轴符号位，用于 是否 reverse +1 / -1
    mainBase, // 主轴开始的位置 0 / style.width
    crossSize, // 交叉轴size
    crossStart, // 交叉轴坐标起点
    crossEnd, // 交叉轴坐标终点
    crossSign, // 交叉轴符号位，用于 是否 reverse
    crossBase; // 交叉轴开始的位置

  if (style.flexDirection === 'row') {
    mainSize = 'width'
    mainStart = 'left'
    mainEnd = 'right'
    mainSign = +1
    mainBase = 0

    crossSize = 'height'
    crossStart = 'top'
    crossEnd = 'bottom'
  } else if (style.flexDirection === 'row-reverse') {
    mainSize = 'width'
    mainStart = 'right'
    mainEnd = 'left'
    mainSign = -1
    mainBase = style.width

    crossSize = 'height'
    crossStart = 'top'
    crossEnd = 'bottom'
  } else if (style.flexDirection === 'column') {
    mainSize = 'height'
    mainStart = 'top'
    mainEnd = 'bottom'
    mainSign = +1
    mainBase = 0

    crossSize = 'width'
    crossStart = 'left'
    crossEnd = 'right'
  } else if (style.flexDirection === 'column-reverse') {
    mainSize = 'height'
    mainStart = 'bottom'
    mainEnd = 'top'
    mainSign = -1
    mainBase = style.height

    crossSize = 'width'
    crossStart = 'left'
    crossEnd = 'right'
  }

  if (style.flexWrap === 'wrap-reverse') {
    let temp = crossStart
    crossStart = crossEnd
    crossEnd = temp
    crossSign = -1
  } else {
    crossBase = 0
    crossSign = +1
  }

}


module.exports = layout;