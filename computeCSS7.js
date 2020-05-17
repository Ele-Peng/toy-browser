// 收集 CSS 规则
const css = require('css')
let currentToken = null
let currentAttribute = null
let currentTextNode = null

let stack = [{type: "document", children: []}]

// 加入一个新的函数，addCSSRules，这里我们把 CSS 规则暂存到一个数组里
let rules = []
function addCSSRules(text) {
  const ast = css.parse(text)
  rules.push(...ast.stylesheet.rules)
}

function match(element, selector) {
  if (!selector || !element.attributes) 
    return false
  
  if (selector.charAt(0) == "#") {
    const attr = element.attributes.filter(attr => attr.name === "id")[0]
    if (attr && attr.value === selector.replace("#", ''))
      return true
  } else if (selector.charAt(0) == ".") {
    const attr = element.attributes.filter(attr => attr.name === "class")[0]
    if (attr) {
      const attrClassArray = attr.value.split(' ')
      for (let attrClass of attrClassArray) {
        if (attrClass === selector.replace(".", '')) {
          return true
        }
      }
    }
  } else {
    if (element.tagName === selector) {
      return true
    }
  }
  return false
}

function specificity(selector) {
  const p = [0, 0, 0, 0]
  const selectorParts = selector.split(" ")
  for (let part of selectorParts) {
    if (part.charAt(0) == "#") {
      p[1] += 1
    } else if (part.charAt(0) == ".") {
      p[2] += 1
    } else {
      p[3] += 1
    }
  }
  return p
}

function compare(sp1, sp2) {
  if (sp1[0] - sp2[0]) {
    return sp1[0] - sp2[0]
  }
  if (sp1[1] - sp2[1]) {
    return sp1[1] - sp2[1]
  }
  if (sp1[2] - sp2[2]) {
    return sp1[2] - sp2[2]
  }
  return sp1[3] - sp2[3]
}

function computeCSS(element) {
  const elements = stack.slice().reverse()

  if (!element.computedStyle)
    element.computedStyle = {}
  
  for (let rule of rules) {
    const selectorParts = rule.selectors[0].split(" ").reverse()

    if (!match(element, selectorParts[0]))
      continue

    let matched = false

    let j = 1

    for (let i = 0; i < elements.length; i ++) {
      if (match(elements[i], selectorParts[j])) {
        j ++
      }
    }
    if (j >= selectorParts.length) {
      matched = true
    }
    if (matched) { // 匹配成功
      const sp = specificity(rule.selectors[0])
      const computedStyle = element.computedStyle
      for (let declaration of rule.declarations) {
        if (!computedStyle[declaration.property]) {
          computedStyle[declaration.property] = {}
        }
        if (!computedStyle[declaration.property].specificity) {
          computedStyle[declaration.property].value = declaration.value
          computedStyle[declaration.property].specificity = sp
        } else if (compare(computedStyle[declaration.property].specificity, sp) < 0) {
          computedStyle[declaration.property].value = declaration.value
          computedStyle[declaration.property].specificity = sp
        }
      }
    }
  }
}

function emit(token) {

  let top = stack[stack.length - 1]

  if (token.type == "startTag") {
    let element = {
      type: "element",
      children: [],
      attributes: []
    }

    element.tagName = token.tagName

    for (let p in token) {
      if (p != "type" && p != "tagName") {
        element.attributes.push({
          name: p,
          value: token[p]
        })
      }
    }

    computeCSS(element)

    top.children.push(element)
    element.parent = top

    if (!token.isSelfClosing)
      stack.push(element)
    
    currentTextNode = null
    // console.log('push', element)
  } else if (token.type == "endTag") {
    if (top.tagName != token.tagName) {
      throw new Error("Tag start end doesn't match")
    } else {
      // console.log('pop', stack.pop())
      /** 遇到 style 标签时，执行添加 CCS 规则的操作 */
      if (top.tagName === "style") {
        addCSSRules(top.children[0].content)
      }
      stack.pop()
    }
    currentTextNode = null
  } else if (token.type == "text") {
    if (currentTextNode == null) {
      currentTextNode = {
        type: "text",
        content: ""
      }
      top.children.push(currentTextNode)
    }
    currentTextNode.content += token.content
    // console.log(top.children)
  }
}

const EOF = Symbol("EOF")

function data(char) {
  if (char == "<") {
    return tagOpen
  } else if (char == EOF) {
    emit({
      type: "EOF"
    })
    return 
  } else {
    emit({
      type: "text",
      content: char
    })
    return data
  }
}


// 1. 开始标签
// 2. 结束标签
// 3. 自封闭标签
function tagOpen(char) {
  if (char == "/") { // 结束标签
    return endTagOpen
  } else if (char.match(/^[a-zA-Z]$/)) { // 开始标签
    currentToken = {
      type: "startTag",
      tagName: ""
    }
    return tagName(char)
  } else {
    // return data
  }
}


function endTagOpen(char) {
  if (char.match(/^[a-zA-Z]$/)) {
    currentToken = {
      type: "endTag",
      tagName: ""
    }
    return tagName(char)
  } else if (char == ">") {
    // return data
  } else if(char == EOF) {
    // return data
  }
}


function tagName(char) {
  if (char.match(/^[\t\n\f ]$/)) {
    return beforeAttributeName(char)
  } else if (char == "/") {
    return selfClosingStartTag
  } else if (char.match(/^[a-zA-Z]$/)) {
    currentToken.tagName += char.toLowerCase()
    return tagName
  } else if (char == ">") {
    emit(currentToken)
    return data
  } else {
    return tagName
  }
}


function beforeAttributeName(char) {
  if (char.match(/^[\t\n\f ]$/)) {
    return beforeAttributeName
  } else if (char == ">" || char == "/" || char == EOF) {
    return afterAttributeName(char)
  } else if (char == "=") {
    return 
  } else {
    currentAttribute = {
      name: "",
      value: ""
    }
    return attributeName(char)
  }
}

function afterAttributeName(char) {
  if (char == "/") {
    return selfClosingStartTag
  } else if (char.match(/^[\t\n\f ]$/)) {
    return afterAttributeName
  } else if (char == "=") {
    return beforeAttributeValue
  } else if (char == ">") {
    currentToken[currentAttribute.name] = currentAttribute.value
    emit(currentToken)
    return data
  } else if (char == EOF) {
    return 
  } else {
    currentToken[currentAttribute.name] = currentAttribute.value
    currentAttribute = {
      name: "",
      value: ""
    }
    return attributeName(char)
  }
}

function attributeName(char) {
  if (char.match(/^[\t\n\f ]$/) || char == "/" || char == ">" || char == EOF) { 
    return afterAttributeName(char)
  } else if (char == "=") {
    return beforeAttributeValue
  } else if (char == "\u0000") {
    // return data
  } else if (char == "\"" || char == "\'" || char == "<") {
    return attributeName
  } else {
    currentAttribute.name += char
    return attributeName
  }
}

function beforeAttributeValue(char) {
  if (char.match(/^[\t\n\f ]$/) || char == "/" || char == ">" || char == EOF) { 
    return beforeAttributeValue
  } else if (char == "\"") {
    return doubleQuotedAttributeValue
  } else if (char == "\'") {
    return singleQuotedAttributeValue
  } else if (char == ">") {
    emit(currentToken)
    // return data
  } else {
    return UnquotedAttributeValue(char)
  }
}

function doubleQuotedAttributeValue(char) {
  if (char == "\"") {
    currentToken[currentAttribute.name] = currentAttribute.value
    return afterQuotedAttributeValue
  } else if (char == "\u0000") {
    // return data
  } else if (char == EOF) {
    // return data
  } else {
    currentAttribute.value += char
    return doubleQuotedAttributeValue
  }
}

function singleQuotedAttributeValue(char) {
  if (char == "\'") {
    currentToken[currentAttribute.name] = currentAttribute.value
    return afterQuotedAttributeValue
  } else if (char == "\u0000") {
    // return data
  } else if (char == EOF) {
    // return data
  } else {
    currentAttribute.value += char
    return singleQuotedAttributeValue
  }
}

function afterQuotedAttributeValue(char) {
  if (char.match(/^[\t\n\f ]$/)) {
    return beforeAttributeName
  } else if (char == "/") {
    return selfClosingStartTag
  } else if (char ==">") {
    currentToken[currentAttribute.name] = currentAttribute.value
    emit(currentToken)
    return data
  } else if (char == EOF) {
    // return data
  } else {
    // return data
  }
}

function UnquotedAttributeValue(char) {
  if (char.match(/^[\t\n\f ]$/)) {
    currentToken[currentAttribute.name] = currentAttribute.value
    // emit(currentToken)
    return beforeAttributeName
  } else if (char == "/") {
    currentToken[currentAttribute.name] = currentAttribute.value
    // emit(currentToken)
    return selfClosingStartTag
  } else if (char == ">") {
    currentToken[currentAttribute.name] = currentAttribute.value
    emit(currentToken)
    return data
  } else if (char == "\u0000") {
    // return data
  } else if (char == "\"" || char == "\'" || char == "<" || char == "=" || char == "`") {
    // return data
  } else if (char == EOF) {
    // return data
  } else {
    currentAttribute.value += char
    return UnquotedAttributeValue
  }
}


function selfClosingStartTag(char) {
  if (char == ">" || char == "/") {
    currentToken.isSelfClosing = true
    emit(currentToken)
    return data
  } else if (char == "EOF") {
    // return data
  } else {
    // return data
  }
}

module.exports.parseHTML = function parseHTML(html){

  let state = data

  for (let char of html) {
    state = state(char)
  }

  state = state(EOF)

  return rules
}