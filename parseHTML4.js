// emitToken 创建元素

let currentToken = null

function emit(token) {
  if (token.type != "text") 
    console.log(token)
}

const EOF = Symbol("EOF")

function data(char) {
  if (char == "<") {
    return tagOpen
  } else if (char == "/") {
    return selfClosingStartTag
  } else if (char == ">") {
    emit(currentToken)
    return data
  } else if (char == EOF) {
    emit({
      type: "EOF"
    })
    return 
  } else {
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
    return 
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

  } else if(char == EOF) {

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
  } else if (char == ">") {
    return beforeAttributeName
  } else if (char == "/") {
    return selfClosingStartTag
  } else if (char == EOF) {
    return 
  } else if (char == "=") {
    return data
  } else {
    return beforeAttributeName
  }
}


function selfClosingStartTag(char) {
  if (char == ">" || char == "/") {
    currentToken.isSelfClosing = true
    currentToken.type = "selfClosingTag"
    emit(currentToken)
    return data
  } else if (char == "EOF") {

  } else {

  }
}

module.exports.parseHTML = function parseHTML(html){

  let state = data

  for (let char of html) {
    state = state(char)
  }

  state = state(EOF)
  
}