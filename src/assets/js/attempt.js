/*****************************************
 * Try/Catch Error Isolation
 *****************************************/

export default function (name, func) {
  'use strict'
  try {
    func()
    console.log('%c[  OK  ] ' + name, 'color:green')
  } catch (e) {
    console.log('%c[ FAIL ] ' + name + ': ' + e.message, 'color:red')
    console.log(e.stack)
  }
}
