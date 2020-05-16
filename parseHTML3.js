// 解析标签

const EOF = Symbol("EOF")

function data(char) {
  if (char == "<") {
    return tagOpen
  } else if (char == EOF) {
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
    return tagName(char)
  } else {
    return 
  }
}


function endTagOpen(char) {
  if (char.match(/^[a-zA-Z]$/)) {
    return tagName(char)
  } else if (char == ">") {

  } else if(char == EOF) {

  }
}


function tagName(char) {
  if (char.match(/^[\t\n\f ]$/)) {
    return beforeAttributeName
  } else if (char == "/") {
    return selfClosingStartTag
  } else if (char.match(/^[a-zA-Z]$/)) {
    return tagName
  } else if (char == ">") {
    return data
  } else {
    return tagName
  }
}


function beforeAttributeName(char) {
  if (char.match(/^[\t\n\f ]$/)) {
    return beforeAttributeName
  } else if (char == ">") {
    return data
  } else if (char == "=") {
    return beforeAttributeName
  } else {
    return beforeAttributeName
  }
}


function selfClosingStartTag(char) {
  if (char == ">") {
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