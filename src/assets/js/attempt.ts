/*****************************************
 * Try/Catch Error Isolation
 *****************************************/

export default function (name: string, func: () => void) {
  'use strict'
  try {
    func()
    console.log('%c[  OK  ] ' + name, 'color:green')
  } catch (e: unknown) {
    if (e instanceof Error) {
      console.log('%c[ FAIL ] ' + name + ': ' + e.message, 'color:red')
      console.log(e.stack)
    }
  }
}
