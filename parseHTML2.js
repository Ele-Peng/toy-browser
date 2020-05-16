// 初始化 FSM - Finite State Machine

const EOF = Symbol("EOF")

function data(char) {

}

module.exports.parseHTML = function parseHTML(html){

  let state = data

  for (let char of html) {
    state = state(c)
  }

  state = state(EOF)
  
}